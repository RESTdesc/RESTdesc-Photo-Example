Feature: photo-get
	Clients should be able to retrieve photos

	Background:
		Given the photo server is running

	Scenario: GET photo with given ID returns the photo
		Given the server has a photo with ID 1
		When I GET /photos/1
		Then I should receive photo 1
		And it should have MIME type image/jpeg

	Scenario: GET photo with given ID has link headers
		Given the server has a photo with ID 1
		When I GET /photos/1
		Then I should receive a face detection link to /photos/1/faces

	Scenario: HEAD photo with given ID has link headers
		Given the server has a photo with ID 1
		When I GET /photos/1
		Then I should receive a face detection link to /photos/1/faces

	Scenario: OPTIONS photo with given ID has link headers
		Given the server has a photo with ID 1
		When I OPTIONS /photos/1
		Then I should receive a face detection link to /photos/1/faces
