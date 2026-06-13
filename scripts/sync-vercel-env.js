#!/usr/bin/env node

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

async function syncVercelEnv() {
  console.log('🔄 Syncing Vercel environment variables...\n');
  
  const projectId = 'prj_TSw4AO7QyjajOAtUk9wVc7dfSD6l';
  const teamId = 'team_evhtTMPqeavXWkwtHSqDI8Go';
  
  try {
    // 1. Get environment variables from Vercel CLI
    console.log('📥 Fetching environment variables from Vercel...');
    
    let vercelEnv = {};
    try {
      const envJson = execSync(
        `vercel env ls ${projectId} --team ${teamId} --json`,
        { stdio: 'pipe' }
      ).toString();
      
      const envData = JSON.parse(envJson);
      envData.forEach(env => {
        if (env.value && !env.key.startsWith('VERCEL_')) {
          vercelEnv[env.key] = env.value;
        }
      });
      
      console.log(`✅ Found ${Object.keys(vercelEnv).length} environment variables`);
    } catch (error) {
      console.log('⚠️  Could not fetch from Vercel CLI:', error.message);
      console.log('Using manual sync approach...');
      
      // Manual list of expected Band variables
      vercelEnv = {
        BAND_API_URL: 'https://app.band.ai',
        BAND_AGENT_API_KEY: 'band_a_...', // Placeholder
        CLAIM_REVIEWER_ID: process.env.CLAIM_REVIEWER_ID || '',
        INVESTIGATOR_ID: process.env.INVESTIGATOR_ID || '',
        ADJUSTER_ID: process.env.ADJUSTER_ID || '',
        GATEWAY_ID: process.env.GATEWAY_ID || '',
        RESOLVER_ID: process.env.RESOLVER_ID || ''
      };
    }
    
    // 2. Read current .env.local
    const envLocalPath = '.env.local';
    let currentEnv = {};
    
    if (existsSync(envLocalPath)) {
      const content = readFileSync(envLocalPath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach(line => {
        if (line.trim() && !line.startsWith('#')) {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            currentEnv[key.trim()] = valueParts.join('=').trim();
          }
        }
      });
    }
    
    // 3. Merge Vercel env with local (prioritize Vercel for Band variables)
    const bandKeys = [
      'BAND_API_URL',
      'BAND_AGENT_API_KEY', 
      'CLAIM_REVIEWER_ID',
      'INVESTIGATOR_ID',
      'ADJUSTER_ID',
      'GATEWAY_ID',
      'RESOLVER_ID'
    ];
    
    const mergedEnv = { ...currentEnv };
    
    bandKeys.forEach(key => {
      if (vercelEnv[key]) {
        mergedEnv[key] = vercelEnv[key];
        console.log(`🔄 Updated ${key} from Vercel`);
      } else if (!mergedEnv[key]) {
        console.log(`❌ ${key} missing in both Vercel and local`);
      }
    });
    
    // 4. Write updated .env.local
    const envLines = [];
    
    // Band variables first
    envLines.push('# Band AI Configuration (from Vercel)');
    bandKeys.forEach(key => {
      if (mergedEnv[key]) {
        envLines.push(`${key}=${mergedEnv[key]}`);
      }
    });
    
    envLines.push('');
    envLines.push('# Supabase Configuration');
    const supabaseKeys = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY'
    ];
    
    supabaseKeys.forEach(key => {
      if (mergedEnv[key]) {
        envLines.push(`${key}=${mergedEnv[key]}`);
      }
    });
    
    envLines.push('');
    envLines.push('# Email (Resend)');
    const emailKeys = ['RESEND_API_KEY', 'NOTIFICATION_FROM_EMAIL'];
    emailKeys.forEach(key => {
      if (mergedEnv[key]) {
        envLines.push(`${key}=${mergedEnv[key]}`);
      }
    });
    
    envLines.push('');
    envLines.push('# App URL');
    envLines.push('NEXT_PUBLIC_APP_URL=https://pilot.nodesemesta.com');
    
    // Write to file
    writeFileSync(envLocalPath, envLines.join('\n'));
    
    console.log('\n✅ Successfully updated .env.local');
    console.log('\n📋 Missing variables that need attention:');
    
    const missing = bandKeys.filter(key => !mergedEnv[key]);
    if (missing.length > 0) {
      missing.forEach(key => {
        console.log(`   - ${key}`);
      });
      console.log('\n🔧 To fix:');
      console.log('   1. Go to Vercel Dashboard → Project → Settings → Environment Variables');
      console.log('   2. Add missing variables');
      console.log('   3. Run this script again: npm run sync-env');
    } else {
      console.log('   None! All variables are synced 🎉');
    }
    
  } catch (error) {
    console.error('❌ Error syncing environment:', error.message);
    console.log('\n🛠️  Manual setup instructions:');
    console.log('   1. Login to Vercel: https://vercel.com');
    console.log('   2. Go to claimpilot project → Settings → Environment Variables');
    console.log('   3. Copy all Band-related variables');
    console.log('   4. Paste them into .env.local');
  }
}

// Fallback: Create .env.local from template if doesn't exist
function createEnvFromTemplate() {
  const template = `# Band AI Configuration (from Vercel)
BAND_API_URL=https://app.band.ai
BAND_AGENT_API_KEY=band_a_...
CLAIM_REVIEWER_ID=
INVESTIGATOR_ID=
ADJUSTER_ID=
GATEWAY_ID=
RESOLVER_ID=a55a1e0d-8ddf-4d08-ac3d-18428c7de10a

# Supabase Configuration (from Vercel)
SUPABASE_URL=https://quzgskthzthmehiamfmk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1emdza3RoenRobWVoaWFtZm1rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTI5NjIyMywiZXhwIjoyMDk2ODcyMjIzfQ.cBPhjsXgU_Uh1hPgeQCmqcbGXdAFfLGOH4MWOYYIo_U
NEXT_PUBLIC_SUPABASE_URL=https://quzgskthzthmehiamfmk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1emdza3RoenRobWVoaWFtZm1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyOTYyMjMsImV4cCI6MjA5Njg3MjIyM30.27nxParbOupZWNEimSuuEdZ3tdSRVFpgNNfRNR1HOG4

# Email (Resend) - Add your keys
RESEND_API_KEY=
NOTIFICATION_FROM_EMAIL=ClaimPilot <noreply@nodesemesta.com>

# App URL
NEXT_PUBLIC_APP_URL=https://pilot.nodesemesta.com

# Development override (for local testing)
# Uncomment and set if different from production
# CLAIM_REVIEWER_ID=dev-reviewer-uuid
# INVESTIGATOR_ID=dev-investigator-uuid
# ADJUSTER_ID=dev-adjuster-uuid
# GATEWAY_ID=dev-gateway-uuid
`;
  
  if (!existsSync('.env.local')) {
    writeFileSync('.env.local', template);
    console.log('📄 Created .env.local from template');
    console.log('⚠️  Please fill in the missing Band agent IDs');
  }
}

// Main execution
try {
  syncVercelEnv();
} catch (error) {
  console.log('Falling back to template creation...');
  createEnvFromTemplate();
}