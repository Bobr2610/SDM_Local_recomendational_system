#!/bin/bash
cd "$(dirname "$0")"
echo "Starting SDM Frontend..."
npm run dev -- --host
