import sys
import json
import time
import random
import os

def mock_optimization(input_path):
    """
    Mocks the heavy CAD optimization process.
    In a real production environment, this would use 'trimesh' or 'opencascade' 
    to decimate the mesh.
    """
    
    # Simulate processing time proportional to "file size" (randomized)
    time.sleep(2) 
    
    file_name = os.path.basename(input_path)
    
    # Generate realistic "Before" stats
    original_poly = random.randint(500000, 2000000)
    original_size_mb = random.uniform(20, 100)
    
    # Generate "After" stats (Optimization target: <5% of original)
    new_poly = int(original_poly * 0.05)
    new_size_mb = original_size_mb * 0.04
    
    return {
        "status": "success",
        "original_poly": original_poly,
        "new_poly": new_poly,
        "reduction_percentage": 95,
        "original_size": f"{original_size_mb:.2f} MB",
        "new_size": f"{new_size_mb:.2f} MB",
        "output_path": input_path.replace(".step", "_optimized.glb").replace(".stp", "_optimized.glb")
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input file provided"}))
        sys.exit(1)
        
    input_file = sys.argv[1]
    
    # Perform optimization
    result = mock_optimization(input_file)
    
    # Output JSON to stdout for Node.js to capture
    print(json.dumps(result))
