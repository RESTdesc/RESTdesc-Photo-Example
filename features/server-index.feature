Feature: photo-index
	Clients should be able to get a list of services

	Background:
		Given the photo server is running

	Scenario: GET photos returns a link to the photos service
		Given there are 3 photos on the server
		When I GET /
		Then I should receive an index link to /photos
