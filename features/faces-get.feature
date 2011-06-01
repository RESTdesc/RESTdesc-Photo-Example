Feature: faces-get
	Clients should be able to retrieve faces

	Background:
		Given the photo server is running

	Scenario: GET photo faces returns a list of faces
		Given the server has a photo with ID 1
		When I GET /photos/1/faces
		Then I should receive a list of 2 faces
