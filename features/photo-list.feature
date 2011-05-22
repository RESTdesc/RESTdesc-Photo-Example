Feature: photo-list
	Clients should be able to get a list of photos

	Background:
		Given the photo server is running

	Scenario: GET photos returns a list of photos
		Given there are 3 photos on the server
		When I GET /photos
		Then I should receive a list of 3 photos
		And it should have MIME type text/html

	Scenario: GET photos links to itself as index
		When I GET /photos
		Then I should receive an index link to /photos
