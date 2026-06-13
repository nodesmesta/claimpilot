#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');

// Load environment variables
try {
  const envContent = readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const [key, value] = line.split('=').map(s => s.trim());
    if (key && value && !key.startsWith('#')) {
      process.env[key] = value;
    }
  });
} catch (error) {
  console.error(`Error loading .env.local: ${error.message}`);
}

async function checkBandAPI() {
  console.log('🔍 Checking Band API Configuration...\n');
  
  // Check required environment variables
  const requiredVars = [
    'BAND_API_URL',
    'BAND_AGENT_API_KEY',
    'CLAIM_REVIEWER_ID',
    'INVESTIGATOR_ID',
    'ADJUSTER_ID',
    'GATEWAY_ID'
  ];
  
  let allVarsPresent = true;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    const status = value ? '✅' : '❌';
    console.log(`${status} ${varName}: ${value || 'MISSING'}`);
    
    if (!value) {
      allVarsPresent = false;
    }
  }
  
  if (!allVarsPresent) {
    console.log('\n⚠️  Missing required environment variables.');
    console.log('Please get agent IDs from: https://app.band.ai/agents');
    console.log('Update .env.local with the correct values.');
    return;
  }
  
  console.log('\n🌐 Testing Band API connection...');
  
  try {
    const BAND_API_URL = process.env.BAND_API_URL || 'https://app.band.ai';
    const BAND_AGENT_API_KEY = process.env.BAND_AGENT_API_KEY;
    
    const response = await fetch(`${BAND_API_URL}/api/v1/agent/chats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': BAND_AGENT_API_KEY
      },
      body: JSON.stringify({ chat: {} })
    });
    
    if (response.ok) {
      console.log('✅ Band API connection successful');
      const data = await response.json();
      console.log(`📝 Test chat ID: ${data.data.id}`);
      
      // Test agent availability
      console.log('\n🤖 Testing agent availability...');
      const agents = [
        { name: 'Reviewer', id: process.env.CLAIM_REVIEWER_ID },
        { name: 'Investigator', id: process.env.INVESTIGATOR_ID },
        { name: 'Adjuster', id: process.env.ADJUSTER_ID },
        { name: 'Gateway', id: process.env.GATEWAY_ID }
      ];
      
      for (const agent of agents) {
        try {
          const agentRes = await fetch(`${BAND_API_URL}/api/v1/agent/agents/${agent.id}`, {
            headers: { 'X-API-Key': BAND_AGENT_API_KEY }
          });
          
          if (agentRes.ok) {
            console.log(`✅ ${agent.name} agent is available`);
          } else {
            console.log(`❌ ${agent.name} agent not found or inaccessible`);
          }
        } catch (error) {
          console.log(`⚠️  ${agent.name} agent check failed: ${error.message}`);
        }
      }
      
    } else {
      console.log(`❌ Band API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`Error details: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`❌ Band API connection failed: ${error.message}`);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your internet connection');
    console.log('2. Verify BAND_AGENT_API_KEY is valid');
    console.log('3. Check if Band.ai service is down: https://status.band.ai');
    console.log('4. Try using a different network (sometimes corporate networks block API calls)');
  }
}

checkBandAPI().catch(console.error);