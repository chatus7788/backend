const app = require("./app");

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => res.send("chatbot! server is running"));
app.listen(PORT, () => console.log(`server running on port ${PORT}`));
