module.exports = {
  routes: [
    {
      "method": "POST",
      "path": "/generate-essay",
      "handler": "essay.generateEssay",
      "config": {
        "policies": []
      }
    }
  ]
}