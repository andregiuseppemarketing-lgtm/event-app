#!/bin/bash

echo "🧪 TESTING MILESTONE 1 - API ENDPOINTS"
echo "========================================"
echo ""

# Test 1: GET /api/user/[slug]
echo "📍 Test 1: GET /api/user/admin"
echo "----------------------------"
RESPONSE=$(curl -s "http://localhost:3000/api/user/admin")
if echo "$RESPONSE" | grep -q "error"; then
  echo "❌ Errore: $RESPONSE"
else
  echo "✅ Endpoint risponde correttamente"
  echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
fi
echo ""

# Test 2: Check routing pages exist
echo "📍 Test 2: Verifica pagine routing"
echo "----------------------------"
echo "Checking /u/[slug] page..."
if [ -f "app/u/[slug]/page.tsx" ]; then
  echo "✅ /u/[slug]/page.tsx exists"
else
  echo "❌ /u/[slug]/page.tsx missing"
fi

echo "Checking /venue/[slug] page..."
if [ -f "app/venue/[slug]/page.tsx" ]; then
  echo "✅ /venue/[slug]/page.tsx exists"
else
  echo "❌ /venue/[slug]/page.tsx missing"
fi

echo "Checking /org/[slug] page..."
if [ -f "app/org/[slug]/page.tsx" ]; then
  echo "✅ /org/[slug]/page.tsx exists"
else
  echo "❌ /org/[slug]/page.tsx missing"
fi
echo ""

# Test 3: Verify API files
echo "📍 Test 3: Verifica file API"
echo "----------------------------"
if [ -f "app/api/user/[slug]/route.ts" ]; then
  echo "✅ /api/user/[slug]/route.ts exists"
else
  echo "❌ /api/user/[slug]/route.ts missing"
fi

if [ -f "app/api/follow/route.ts" ]; then
  echo "✅ /api/follow/route.ts exists"
else
  echo "❌ /api/follow/route.ts missing"
fi
echo ""

echo "🎉 Test completati!"
