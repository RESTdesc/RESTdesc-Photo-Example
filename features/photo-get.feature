Feature: GET photo
	Clients should be able to retrieve photos

	Scenario: GET photo with given ID returns the photo
		Given I have a photo with ID 1
		When I GET /photos/1
		Then I should receive photo 1
		And it should have MIME type image/jpeg
