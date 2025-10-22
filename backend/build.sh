#!/bin/bash
# Production build script to handle PyYAML installation

echo "🔧 Installing build dependencies..."
pip install --upgrade pip setuptools wheel cython

echo "🔧 Installing PyYAML with pre-compiled wheels..."
pip install --only-binary=all PyYAML

echo "🔧 Installing remaining dependencies..."
pip install -r requirements.txt

echo "✅ Build completed successfully!"
