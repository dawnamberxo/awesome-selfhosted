import requests
import sys
import base64
import json
from datetime import datetime

class NudgeAPITester:
    def __init__(self, base_url="https://ebce61ab-0068-4c48-bf95-2c50be88844c.preview.emergentagent.com"):
        self.base_url = base_url
        self.session_id = None
        self.tests_run = 0
        self.tests_passed = 0
        
    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        self.log(f"Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - {name} - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                self.log(f"❌ FAILED - {name} - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    self.log(f"   Error: {error_detail}")
                except:
                    self.log(f"   Response: {response.text[:200]}")
                return False, {}
                
        except Exception as e:
            self.log(f"❌ FAILED - {name} - Exception: {str(e)}")
            return False, {}
    
    def create_test_image_base64(self):
        """Create a simple test image as base64"""
        # Create a minimal PNG image (1x1 pixel red dot)
        import io
        try:
            from PIL import Image
            img = Image.new('RGB', (100, 100), color='red')
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG')
            return base64.b64encode(buffer.getvalue()).decode('utf-8')
        except ImportError:
            # Fallback: Create a minimal base64 encoded image data
            # This is a 1x1 red pixel PNG
            png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x0bIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00\x00\x00\x7f\x18U\x00\x00\x00\x00IEND\xaeB`\x82'
            return base64.b64encode(png_data).decode('utf-8')
    
    def test_health_endpoint(self):
        """Test health check endpoint"""
        return self.run_test("Health Check", "GET", "api/health", 200)
    
    def test_session_creation(self):
        """Test creating a new session"""
        success, response = self.run_test(
            "Create Session",
            "POST", 
            "api/sessions",
            200,
            data={"name": "Test Space"}
        )
        if success and 'session_id' in response:
            self.session_id = response['session_id']
            self.log(f"   Created session: {self.session_id}")
            return True
        return False
    
    def test_get_session(self):
        """Test getting session data"""
        if not self.session_id:
            self.log("❌ No session ID available for test")
            return False
        return self.run_test(
            "Get Session",
            "GET",
            f"api/sessions/{self.session_id}",
            200
        )[0]
    
    def test_analyze_space(self):
        """Test space analysis with AI"""
        if not self.session_id:
            self.log("❌ No session ID available for test")
            return False
        
        image_base64 = self.create_test_image_base64()
        success, response = self.run_test(
            "Analyze Space", 
            "POST",
            "api/analyze-space",
            200,
            data={
                "session_id": self.session_id,
                "image_base64": image_base64
            }
        )
        if success and response.get('analysis'):
            self.log(f"   Analysis result: {response['analysis'].get('overview', 'No overview')[:50]}...")
            return True
        return False
    
    def test_generate_tasks(self):
        """Test task generation after analysis"""
        if not self.session_id:
            self.log("❌ No session ID available for test")
            return False
            
        success, response = self.run_test(
            "Generate Tasks",
            "POST",
            "api/generate-tasks", 
            200,
            data={"session_id": self.session_id}
        )
        if success and response.get('tasks'):
            task_count = len(response['tasks'])
            self.log(f"   Generated {task_count} tasks")
            return True
        return False
    
    def test_complete_task(self):
        """Test marking a task as complete"""
        if not self.session_id:
            self.log("❌ No session ID available for test")
            return False
        
        # First get the session to find a task
        success, session_data = self.run_test(
            "Get Session for Task",
            "GET",
            f"api/sessions/{self.session_id}",
            200
        )
        
        if not success or not session_data.get('tasks'):
            self.log("❌ No tasks available to complete")
            return False
        
        task_id = session_data['tasks'][0]['task_id']
        return self.run_test(
            "Complete Task",
            "PUT",
            f"api/sessions/{self.session_id}/tasks/{task_id}",
            200,
            data={"completed": True}
        )[0]
    
    def test_identify_items(self):
        """Test item identification with AI"""
        if not self.session_id:
            self.log("❌ No session ID available for test")
            return False
        
        image_base64 = self.create_test_image_base64()
        success, response = self.run_test(
            "Identify Items",
            "POST", 
            "api/identify-items",
            200,
            data={
                "session_id": self.session_id,
                "image_base64": image_base64
            }
        )
        if success and response.get('items'):
            item_count = len(response['items'])
            self.log(f"   Identified {item_count} items")
            return True
        return False
    
    def test_sort_item(self):
        """Test sorting an item"""
        if not self.session_id:
            self.log("❌ No session ID available for test")
            return False
        
        # First get the session to find an item
        success, session_data = self.run_test(
            "Get Session for Item",
            "GET",
            f"api/sessions/{self.session_id}",
            200
        )
        
        if not success or not session_data.get('items'):
            self.log("❌ No items available to sort")
            return False
        
        item_id = session_data['items'][0]['item_id']
        return self.run_test(
            "Sort Item",
            "PUT",
            f"api/sessions/{self.session_id}/items/{item_id}",
            200,
            data={"decision": "keep"}
        )[0]

def main():
    """Run all tests"""
    tester = NudgeAPITester()
    
    print("🧪 Starting Nudge API Tests")
    print(f"Backend URL: {tester.base_url}")
    print("-" * 60)
    
    # Test sequence
    test_results = {}
    
    # Basic tests
    test_results['health'] = tester.test_health_endpoint()
    test_results['create_session'] = tester.test_session_creation()
    test_results['get_session'] = tester.test_get_session()
    
    # AI-powered tests (these might take longer)
    test_results['analyze_space'] = tester.test_analyze_space()
    test_results['generate_tasks'] = tester.test_generate_tasks()
    test_results['complete_task'] = tester.test_complete_task()
    test_results['identify_items'] = tester.test_identify_items()
    test_results['sort_item'] = tester.test_sort_item()
    
    # Results summary
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:20} {status}")
    
    print(f"\nTotal: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed - check logs above")
        return 1

if __name__ == "__main__":
    sys.exit(main())