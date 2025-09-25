#!/bin/bash

# Debug Consumer Script for Integration Run Worker
# This script starts a debug consumer with a separate consumer group ID
# to inspect messages in the integration-run-worker-high-production topic

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Kafka Debug Consumer for Integration Run Worker${NC}"
echo -e "${BLUE}=================================================${NC}"

# Check if we're in the right directory
if [ ! -f "debug-consumer.ts" ]; then
    echo -e "${RED}❌ Error: debug-consumer.ts not found. Please run this script from the integration_run_worker directory.${NC}"
    exit 1
fi

# Set custom group ID (you can override this)
export DEBUG_GROUP_ID="${DEBUG_GROUP_ID:-debug-consumer-$(date +%s)}"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo -e "   Consumer Group ID: ${DEBUG_GROUP_ID}"
echo -e "   Topic: integration-run-worker-high-production"
echo -e "   Environment: $(echo $NODE_ENV || echo 'development')"
echo ""

echo -e "${YELLOW}🎯 What this script does:${NC}"
echo -e "   ✅ Creates a separate consumer group (won't interfere with main worker)"
echo -e "   ✅ Shows all messages in the topic from the beginning"
echo -e "   ✅ Displays message content and processing status"
echo -e "   ✅ Commits offsets to track progress"
echo ""

echo -e "${YELLOW}💡 Usage tips:${NC}"
echo -e "   • Press Ctrl+C to stop gracefully"
echo -e "   • Set DEBUG_GROUP_ID=my-group to use a custom group ID"
echo -e "   • Messages will be processed from where this group last left off"
echo ""

read -p "Press Enter to start the debug consumer, or Ctrl+C to cancel..."

echo -e "${GREEN}🚀 Starting debug consumer...${NC}"

# Compile and run the TypeScript file
npx tsx debug-consumer.ts
