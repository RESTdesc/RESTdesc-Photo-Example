Feature: photo-get
	Clients should be able to post photos

	Background:
		Given the photo server is running

	Scenario: POST photo with given ID returns location
		When I POST the file obama-kenny.jpg as photo to /photos
		Then the response status should be 201 Created
		And the response location should be /photos/2
		And I should receive a link to photo 2
