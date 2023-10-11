module.exports = {
  routes: [
    {
      "method": "POST",
      "path": "/generate-rating",
      "handler": "edit.generateRating",
      "config": {
        "policies": []
      }
    }
  ]
}