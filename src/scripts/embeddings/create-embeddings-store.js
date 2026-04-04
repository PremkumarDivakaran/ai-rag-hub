import { MongoClient } from "mongodb";
import dns from "dns";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Fix DNS resolution issue on macOS by using Google's DNS servers
dns.setServers(['8.8.8.8', '8.8.4.4']);

// Configure MongoDB client with SSL options
const client = new MongoClient(process.env.MONGODB_URI, {
  ssl: true,
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
});

// LLM API configuration
const LLM_API_BASE = process.env.LLM_API_BASE || 'https://api.openai.com';
const USER_EMAIL = process.env.USER_EMAIL;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

async function main() {
  try {
    await client.connect();
    const db = client.db(process.env.DB_NAME);
    const collection = db.collection(process.env.COLLECTION_NAME);

    // Load sample testcases
    const testcases = JSON.parse(fs.readFileSync("src/data/testcases.json", "utf-8"));

    console.log(`🚀 Processing ${testcases.length} test cases using LLM API...`);
    console.log(`⚙️  Configuration:`);
    console.log(`   🌐 API Base: [CONFIGURED]`);
    console.log(`   📧 User Email: ${USER_EMAIL}`);
    console.log(`   🔑 Auth Token: ${AUTH_TOKEN ? '✅ Provided' : '❌ Missing'}`);
    console.log(`   🗄️  Database: ${process.env.DB_NAME}`);
    console.log(`   📦 Collection: ${process.env.COLLECTION_NAME}`);
    console.log(``);
    let totalCost = 0;
    let totalTokens = 0;

    for (const testcase of testcases) {
      console.log(`📝 Processing: ${testcase.id} - ${testcase.description.substring(0, 50)}...`);
      
      try {

        const inputText = `
          ID: ${testcase.id}
          Module: ${testcase.module}
          Title: ${testcase.title}
          Description: ${testcase.description}
          Steps: ${testcase.steps}
          Expected Result: ${testcase.expectedResults}
        `;
        
        // Generate embeddings using LLM API
        const embeddingResponse = await axios.post(
          `${LLM_API_BASE}/embedding/text/${USER_EMAIL}`,
          {
            input: inputText,
            model: "text-embedding-3-small"
          },
          {
            headers: {
              'Content-Type': 'application/json',
              ...(AUTH_TOKEN && { 'Authorization': `Bearer ${AUTH_TOKEN}` })
            }
          }
        );

        console.log(`📡 Server Response Received:`);
        console.log(`   📊 Status: ${embeddingResponse.status}`);
        console.log(`   📋 Response Status: ${embeddingResponse.data.status}`);
        console.log(`   💬 Message: ${embeddingResponse.data.message || 'No message'}`);
        
        if (embeddingResponse.data.status !== 200) {
          console.error(`❌ API Error Response:`, embeddingResponse.data);
          throw new Error(`LLM API error: ${embeddingResponse.data.message}`);
        }

        const vector = embeddingResponse.data.data[0].embedding;
        const cost = embeddingResponse.data.cost || 0;
        const tokens = embeddingResponse.data.usage?.total_tokens || 0;
        
        console.log(`✅ Embedding Generated Successfully:`);
        console.log(`   🤖 Model Used: ${embeddingResponse.data.model}`);
        console.log(`   💰 Cost: $${cost.toFixed(6)}`);
        console.log(`   🔢 Tokens Used: ${tokens}`);
        console.log(`   📐 Vector Dimensions: ${vector?.length || 'Unknown'}`);
        console.log(`   📊 Usage Details:`, embeddingResponse.data.usage);

        totalCost += cost;
        totalTokens += tokens;

        // Add embedding and timestamp
        const doc = {
          ...testcase,
          embedding: vector,
          createdAt: new Date(),
          embeddingMetadata: {
            model: embeddingResponse.data.model,
            cost: cost,
            tokens: tokens,
            apiSource: 'llm'
          }
        };

        console.log(`💾 Inserting into MongoDB...`);
        const result = await collection.insertOne(doc);
        console.log(`✅ Successfully Inserted:`);
        console.log(`   🆔 Test Case: ${testcase.id}`);
        console.log(`   💰 Cost: $${cost.toFixed(6)}`);
        console.log(`   🔢 Tokens: ${tokens}`);
        console.log(`   🗃️  Mongo ID: ${result.insertedId}`);
        console.log(`   📊 Document Size: ${JSON.stringify(doc).length} bytes`);
        
        // Small delay to avoid overwhelming the API
        console.log(`⏸️  Waiting 100ms before next request...\n`);
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error processing ${testcase.id}:`);
        
        if (error.response) {
          console.error(`   🌐 HTTP Status: ${error.response.status}`);
          console.error(`   📋 Response Data:`, error.response.data);
          console.error(`   🔗 Request URL: ${error.config?.url || 'Unknown'}`);
          console.error(`   📝 Request Method: ${error.config?.method || 'Unknown'}`);
        } else if (error.request) {
          console.error(`   📡 No response received from server`);
          console.error(`   🔗 Request URL: ${LLM_API_BASE}/embedding/text/${USER_EMAIL}`);
          console.error(`   ⏰ Possible timeout or network issue`);
        } else {
          console.error(`   💥 Error Message: ${error.message}`);
          console.error(`   📚 Error Stack:`, error.stack);
        }
        
        // Continue with next test case instead of failing completely
        console.log(`⏭️  Skipping to next test case...\n`);
        continue;
      }
    }

    console.log(`\n🎉 Processing complete!`);
    console.log(`💰 Total Cost: $${totalCost.toFixed(6)}`);
    console.log(`🔢 Total Tokens: ${totalTokens}`);
    console.log(`📊 Average Cost per Test Case: $${(totalCost / testcases.length).toFixed(6)}`);

  } catch (err) {
    if (err.response) {
      console.error("❌ LLM API Error:", err.response.status, err.response.data);
    } else {
      console.error("❌ Error:", err.message);
    }
  } finally {
    await client.close();
  }
}

main();
