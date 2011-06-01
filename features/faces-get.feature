Feature: faces-get
	Clients should be able to retrieve faces

	Background:
		Given the photo server is running

	Scenario: GET photo faces returns a list of faces
		Given the server has a photo with ID 1
		When I GET /photos/1/faces
		Then I should receive a list of 2 faces

	Scenario: GET photo faces has link headers to faces
		Given the server has a photo with ID 1
		When I GET /photos/1/faces
		Then I should receive a face link to /photos/1/faces/1
		Then I should receive a face link to /photos/1/faces/2

	Scenario: GET photo faces has link headers to persons
		Given the server has a photo with ID 1
		When I GET /photos/1/faces
		Then I should receive a face recognition link to /photos/1/persons/1
		Then I should receive a face recognition link to /photos/1/persons/2
