const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
app.use(express.json());

// MongoDB 연결 문자열 (쿠버네티스 환경에서 환경변수로 주입 가정)
const mongoUrl = process.env.MONGO_URI || "mongodb://localhost:27017/testdb";

app.get("/", (req, res) => {
  res.send("Hello from SSE Service!");
});

app.get("/pingDB", async (req, res) => {
  try {
    const client = new MongoClient(mongoUrl);
    await client.connect();
    const db = client.db(); // default DB
    // 간단히 컬렉션 하나 조회
    const collections = await db.listCollections().toArray();
    await client.close();
    res.json({
      ok: true,
      mongoUrl: mongoUrl,
      collections: collections.map((c) => c.name),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get("/rs-status", async (req, res) => {
  try {
    const client = await MongoClient.connect(mongoUrl);
    const adminDb = client.db("admin");

    const result = await adminDb.command({ replSetGetStatus: 1 });

    res.json(result);
    await client.close();
  } catch (err) {
    console.error("MongoDB 연결 실패", err);
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`SSE Service listening on port ${port}`);
});
