#!/bin/bash
# Script to configure CORS for Firebase Storage

echo "Configuring CORS for Firebase Storage"
echo "===================================="
echo ""

# Create cors.json file
echo "Creating cors.json configuration file..."
cat > cors.json << EOL
[
  {
    "origin": ["http://localhost:5173", "http://127.0.0.1:5173"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Content-Length", "Content-Disposition"]
  }
]
EOL

echo "Created cors.json with development settings."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
  echo "Firebase CLI not found. Please install it with:"
  echo "npm install -g firebase-tools"
  echo ""
  echo "After installing, run:"
  echo "firebase login"
  echo "firebase storage:cors update --config=cors.json"
  exit 1
fi

# Ask user if they want to proceed
read -p "Do you want to update Firebase Storage CORS settings now? (y/n): " choice

if [[ "$choice" == "y" || "$choice" == "Y" ]]; then
  echo ""
  echo "Updating Firebase Storage CORS settings..."
  firebase storage:cors update --config=cors.json
  
  echo ""
  echo "CORS configuration complete!"
  echo "If you need to add more domains (like your production URL),"
  echo "edit the cors.json file and run this script again."
else
  echo ""
  echo "CORS update skipped."
  echo "You can manually update later with:"
  echo "firebase storage:cors update --config=cors.json"
fi 