module.exports = {
  routes: [
    {
      "method": "GET",
      "path": "/generate-rating",
      "handler": "edit.generateRating",
      "config": {
        "policies": []
      }
    }
  ]
}