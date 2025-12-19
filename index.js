const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
// Middleware
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose
  .connect("mongodb+srv://20225356:20225356@it4409.g5jn1r8.mongodb.net/it4409")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Error:", err));
// TODO: Tạo Schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên không được để trống"],
    minlength: [2, "Tên phải có ít nhất 2 ký tự"],
  },
  age: {
    type: Number,
    required: [true, "Tuổi không được để trống"],
    min: [0, "Tuổi phải >= 0"],
  },
  email: {
    type: String,
    required: [true, "Email không được để trống"],
    match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
  },
  address: {
    type: String,
  },
});
const User = mongoose.model("User", UserSchema);
// TODO: Implement API endpoints
app.get("/api/users", async (req, res) => {
  try {
    // Lấy query params (CONST => LET)
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 5;
    let search = req.query.search || "";
    // GIỚI HẠN PAGE VÀ LIMIT
    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 50) limit = 50;
    // Tạo query filter cho search
    const filter = search
      ? {
          $or: [
            //Nguời dùng nhập từ khoá tìm kiếm
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { address: { $regex: search, $options: "i" } },
          ],
        }
      : {};
    // Tính skip
    const skip = (page - 1) * limit;

    // Query database (bỏ qua dữ liệu ở các trang trước)
    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Trả về response
    res.json({
      page,
      limit,
      total,
      totalPages,
      data: users,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    // Lấy dữ liệu từ request body
    let { name, age, email, address } = req.body;
    name = name.trim();
    age = parseInt(age);
    email = email.trim();
    address = address.trim();

    //Tuổi phải là số nguyên
    if (isNaN(age)) {
      return res.status(400).json({ error: "Tuổi phải là số nguyên" });
    }
    //Xử lý nếu email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email đã tồn tại" });
    }

    // Tạo user mới, insert vào database
    const newUser = await User.create({ name, age, email, address });
    // Trả về response nếu tạo thành công
    res.status(201).json({
      message: "Tạo người dùng thành công",
      data: newUser,
    });
  } catch (err) {
    // Xử lý lỗi
    res.status(400).json({ error: err.message });
  }
});

// Cập nhật dữ liệu
app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params; // Lấy ID từ URL
    // THÊM: Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }
    // Tạo object cập nhật
    const updates = {};

    // THÊM: Chỉ cập nhật trường được truyền vào
    if (req.body.name) updates.name = req.body.name.trim();
    if (req.body.email) updates.email = req.body.email.trim();
    if (req.body.address) updates.address = req.body.address.trim();
    if (req.body.age !== undefined) {
      const age = parseInt(req.body.age);
      if (isNaN(age)) {
        return res.status(400).json({ error: "Tuổi phải là số nguyên" });
      }
      updates.age = age;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    res.json({
      message: "Cập nhật người dùng thành công",
      data: updatedUser,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // THÊM: Kiểm tra ID hợp lệ
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    res.json({ message: "Xóa người dùng thành công" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// Start server
app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
