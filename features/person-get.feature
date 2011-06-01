Feature: persons-get
	Clients should be able to retrieve persons

	Background:
		Given the photo server is running

	Scenario: GET photo person returns person
		Given the server has a photo with ID 1
		When I GET /photos/1/persons/1
		Then I should receive the person Barack Obama
		And it should have MIME type text/plain
