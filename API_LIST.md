# DANH SÁCH API - RESCUE BACKEND

Cập nhật lần cuối: 2026-03-19
Tổng cộng: 41 API

---

## Authentication (/auth) — 3 API

1. POST /auth/register – Đăng ký thành viên mới (Tự tạo USR-CODE) [Public]
2. POST /auth/login – Đăng nhập lấy Access Token [Public]
3. GET /auth/check-token – Kiểm tra Token còn hạn hay không [Auth]

## Users Management (/users) — 7 API

4. GET /users/profile – Xem hồ sơ của chính mình (từ DB) [Auth]
5. PATCH /users/profile – Cập nhật thông tin cá nhân (Tên, SĐT...) [Auth]
6. PATCH /users/change-password – Đổi mật khẩu tài khoản [Auth]
7. GET /users – [Admin] Lấy danh sách tất cả người dùng [Admin]
8. GET /users/:phone – [Admin] Tìm chi tiết người dùng qua SĐT [Admin]
9. PATCH /users/:id/role – [Admin] Cấp quyền (đổi Role) cho người dùng [Admin]
10. DELETE /users/:id – [Admin] Vô hiệu hóa (Xóa mềm) người dùng [Admin]

## Rescue Requests (/rescue-requests) — 10 API

11. GET /rescue-requests/nearby – [Team] Radar: Tìm yêu cầu cứu hộ gần đây [Rescue_Team]
12. GET /rescue-requests/my-requests – [Citizen] Xem lịch sử kêu cứu của bản thân [Citizen]
13. GET /rescue-requests/assigned-tasks – [Team] Xem nhiệm vụ được phân công [Rescue_Team, Coordinator]
14. GET /rescue-requests – [Coordinator] Lấy tất cả danh sách yêu cầu [Coordinator, Admin]
15. POST /rescue-requests – [Citizen] Gửi yêu cầu cứu hộ mới [Citizen]
16. GET /rescue-requests/:id – Xem chi tiết 1 yêu cầu cứu hộ [Auth]
17. PATCH /rescue-requests/:id/verify – [Coordinator] Xác minh & Phân loại khẩn cấp [Coordinator, Admin]
18. PATCH /rescue-requests/:id/status – [Team] Cập nhật tiến độ cứu hộ [Rescue_Team]
19. PATCH /rescue-requests/:id/assign – [Coordinator] Gán đội cứu hộ cho yêu cầu [Coordinator, Admin]
20. PATCH /rescue-requests/:id/confirm-rescued – [Citizen] Xác nhận đã an toàn (Đóng đơn) [Citizen]
21. PATCH /rescue-requests/:id/cancel – [Citizen/Coordinator] Hủy yêu cầu cứu hộ [Citizen, Coordinator]

## Rescue Teams (/rescue-teams) — 9 API

22. POST /rescue-teams – [Admin/Manager] Tạo đội cứu hộ mới [Admin, Manager]
23. GET /rescue-teams – Xem toàn bộ danh sách Đội cứu hộ [Auth]
24. GET /rescue-teams/:id – Xem chi tiết 1 Đội cứu hộ [Auth]
25. PATCH /rescue-teams/:id – [Admin/Manager/Coordinator] Cập nhật thông tin cơ bản [Admin, Manager, Coordinator]
26. POST /rescue-teams/:id/members/:userId – [Admin/Manager] Thêm thành viên vào đội [Admin, Manager]
27. DELETE /rescue-teams/:id/members/:userId – [Admin/Manager] Xóa thành viên khỏi đội [Admin, Manager]
28. POST /rescue-teams/:id/vehicles/:vehicleId – [Admin/Manager/Coordinator] Cấp phương tiện cho đội [Admin, Manager, Coordinator]
29. DELETE /rescue-teams/:id/vehicles/:vehicleId – [Admin/Manager/Coordinator] Thu hồi phương tiện [Admin, Manager, Coordinator]
30. PATCH /rescue-teams/:id/location – [Team] Cập nhật vị trí GPS liên tục [Rescue_Team]

## Vehicles (/vehicles) — 7 API

31. POST /vehicles – [Manager/Admin] Thêm phương tiện mới vào kho [Manager, Admin]
32. GET /vehicles – Xem toàn bộ phương tiện (Trừ xe thanh lý) [Auth]
33. GET /vehicles/available – [Coordinator] Lấy danh sách xe đang rảnh [Auth]
34. GET /vehicles/:id – Xem chi tiết 1 phương tiện [Auth]
35. PATCH /vehicles/:id – [Manager/Admin] Cập nhật thông tin xe [Manager, Admin]
36. PATCH /vehicles/:id/status – [Manager/Coordinator] Cập nhật tình trạng xe [Manager, Admin, Coordinator]
37. DELETE /vehicles/:id – [Manager/Admin] Thanh lý / Xóa mềm phương tiện [Manager, Admin]

## Inventories (/inventories) — 3 API

38. POST /inventories – [Manager/Admin] Thêm mặt hàng mới vào kho [Manager, Admin]
39. GET /inventories – Xem danh sách tất cả vật phẩm trong kho [Auth]
40. PATCH /inventories/:id/stock – [Manager/Coordinator] Nhập/Xuất kho (số âm = xuất) [Manager, Admin, Coordinator]

## Upload (/upload) — 1 API

41. POST /upload/image – Upload file ảnh (jpg, png, gif) [Public]

## App Root (/) — 1 API
42. GET / – Health check [Public]

---

# PHÂN TÍCH THIẾU SÓT — GÓC NHÌN SENIOR BACKEND

## CRITICAL — Cần có trước khi lên Production

### Authentication & Security
- POST /auth/refresh-token – Access Token hết hạn thì user phải login lại, cần Refresh Token để UX tốt
- POST /auth/logout – Blacklist token (nếu dùng JWT) hoặc xóa session phía server
- POST /auth/forgot-password – Gửi mã OTP/email để reset mật khẩu khi user quên
- POST /auth/reset-password – Nhận OTP + mật khẩu mới để đặt lại

### Rescue Requests — Thiếu flow quan trọng
- PATCH /rescue-requests/:id/cancel – Citizen huỷ đơn khi chưa có đội nhận, tránh lãng phí tài nguyên
- PATCH /rescue-requests/:id/reject – Coordinator từ chối đơn giả/spam, trả về lý do reject
- GET /rescue-requests/stats – Dashboard thống kê: tổng đơn, đang xử lý, hoàn thành...

### Inventories — Thiếu CRUD cơ bản
- GET /inventories/:id – Xem chi tiết 1 mặt hàng (đang thiếu findOne)
- PATCH /inventories/:id – Sửa thông tin mặt hàng (tên, đơn vị, category)
- DELETE /inventories/:id – Xoá mềm vật phẩm không còn sử dụng
- GET /inventories/low-stock – Cảnh báo hàng sắp hết (quantity < ngưỡng)

## HIGH — Nên có cho hệ thống hoàn chỉnh

### Users — Thiếu chức năng quản trị
- PATCH /users/:id/reactivate – Admin kích hoạt lại tài khoản đã bị xóa mềm
- GET /users/stats – Thống kê user theo role, active/inactive

### Rescue Teams — Thiếu quản lý vòng đời
- DELETE /rescue-teams/:id – Giải tán đội (xóa mềm), hiện tại không có cách deactivate
- PATCH /rescue-teams/:id/status – Cập nhật trạng thái đội (AVAILABLE/BUSY/OFFLINE) riêng biệt
- GET /rescue-teams/available – Coordinator lọc nhanh đội đang rảnh để điều phối

### Notifications — Module mới
- GET /notifications – Lấy danh sách thông báo của user đang đăng nhập
- PATCH /notifications/:id/read – Đánh dấu đã đọc thông báo
- WebSocket Gateway – Push realtime: đơn mới, đội được assign, cập nhật status

## NICE-TO-HAVE — Nâng cao chất lượng sản phẩm

### Pagination & Filtering
- Các endpoint GET /users, GET /rescue-requests, GET /vehicles... đang trả toàn bộ data
- Cần thêm query params: ?page=1&limit=20&sort=-createdAt&status=PENDING

### Audit Log / Activity History
- GET /rescue-requests/:id/history – Xem timeline: ai tạo → ai verify → ai assign → ai hoàn thành
- GET /inventories/:id/transactions – Lịch sử nhập/xuất kho của từng vật phẩm

### Reports & Export
- GET /reports/rescue-summary – Báo cáo tổng hợp cứu hộ theo khoảng thời gian
- GET /reports/inventory – Báo cáo xuất nhập tồn kho

### Upload mở rộng
- DELETE /upload/:filename – Xoá file upload (khi user huỷ đơn, xoá ảnh thừa)
- Thêm Auth Guard cho Upload – Hiện tại endpoint upload KHÔNG CÓ xác thực, ai cũng upload được
