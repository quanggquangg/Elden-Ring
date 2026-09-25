# Vòng Vàng Vỡ

Game hành động **souls-like 2D** chạy trên trình duyệt, lấy cảm hứng từ Elden Ring. Code viết tay bằng HTML5 Canvas và JavaScript thuần: không cần thư viện, không cần bước build, và âm thanh được tổng hợp bằng WebAudio.

> Game do người hâm mộ tự làm. Không liên quan tới FromSoftware hay Bandai Namco.

## Chơi thế nào

Mở `index.html` bằng trình duyệt là chơi được. Nếu muốn chạy qua server tĩnh:

```bash
python3 -m http.server 8000
# rồi mở http://localhost:8000
```

**Mục tiêu:** chọn xuất thân, rời Nhà Nguyện, hạ **Varek** ở cổng phía bắc, rồi thu thập đủ **ba Đại Ấn**:

- **Đại Ấn Pháo Đài** từ Dornach trong Pháo Đài Đá Xám (phía đông, giải đố lò lửa để vào).
- **Đại Ấn Rồng Tro** từ rồng Ignarth trong Đầm Lầy Tro Độc.
- **Đại Ấn Trăng Pha Lê** từ Selvara, nữ hoàng của Học Viện Pha Lê bên Hồ Pha Lê (phía tây, cần Chìa Khóa Pha Lê trên một hòn đảo giữa hồ).

Đủ ba Đại Ấn thì cổng **Kinh Thành Vàng** trên Cao Nguyên Hoàng Kim mở ra. Trong Kinh Thành, Varek trở lại với hình dạng thật là **Vua Ẩn Mặt**. Hạ hắn để tới **Cây Vàng**, rồi vượt qua trận cuối hai giai đoạn ở Cõi Vàng.

## Điều khiển

Phím đặt theo Elden Ring bản PC. `Space` dùng cho lăn và chạy như bản gốc.

| Hành động | Bàn phím / chuột | Tay cầm (Xbox / PlayStation) |
|---|---|---|
| Di chuyển | `W` `A` `S` `D` | cần trái |
| Lăn né / chạy nhanh | nhấn / giữ `Space` | nhấn / giữ B / ○ |
| Đánh thường / đánh mạnh | chuột trái / `Shift` + chuột trái | RB / RT |
| Đỡ, phản đòn (tay trái cầm khiên) | giữ chuột phải | giữ LB / L1 |
| Niệm phép (tay trái cầm gậy hoặc ấn) | giữ chuột phải | giữ LB / L1 |
| Kỹ năng vũ khí (Tro Chiến Tranh) | `Shift` + chuột phải | LT / L2 |
| Dùng đồ trong ô nhanh / đổi đồ | `R` / `↓` | X / □, D-pad ↓ |
| Đổi phép | `↑` | D-pad ↑ |
| Đổi vũ khí tay phải | `←` `→` (hoặc `1`–`9`) | D-pad ← → |
| Tương tác, mở rương, nói chuyện | `E` | Y / △ |
| Khóa mục tiêu | `Q` hoặc chuột giữa | R3 |
| Gọi / xuống ngựa | `F` | A / × |
| Bản đồ / tạm dừng / âm thanh | `G` / `Esc` / `M` | Back / Start |

Chỉ dùng bàn phím: `J` đánh thường, `K` đánh mạnh, giữ `X` để đỡ hoặc niệm phép, `C` dùng kỹ năng. Trên điện thoại, game tự hiện cần điều khiển ảo và các nút bấm.

## Phát triển nhân vật

- **5 xuất thân:** Hiệp Sĩ, Kiếm Khách, Pháp Sư, Tu Sĩ, Thợ Săn. Tất cả bắt đầu ở cấp 1 với trang bị tồi tàn; xuất thân chỉ quyết định chỉ số ban đầu.
- **7 chỉ số:** Sinh Lực (máu), Tâm Trí (FP), Bền Bỉ (thể lực và sức mang vác), Sức Mạnh, Khéo Léo, Trí Tuệ, Đức Tin. Lên cấp bằng rune tại Ân Điển.
- **Vũ khí có hệ số và yêu cầu chỉ số** (S/A/B/C/D/E) như Elden Ring. Hệ số tăng chậm dần sau các mốc 20, 40, 60. Thiếu chỉ số thì sát thương giảm mạnh. Sát thương chia theo loại: vật lý, ma thuật, lửa, thánh, sét; mỗi loại kẻ địch kháng hoặc yếu với loại khác nhau (hồn ma sợ thánh, người pha lê kháng ma thuật...).
- **Hai tay:** tay phải cầm vũ khí hoặc cung. Tay trái cầm khiên (đỡ, phản đòn) hoặc chất xúc tác (gậy cho phép Trí Tuệ, ấn cho phép Đức Tin). Vũ khí hai tay và cung khóa tay trái.
- **17 vũ khí tay phải:** kiếm, dao, kiếm liễu, katana, giáo, rìu, đại kiếm, đại rìu, chùy, liềm, kiếm pha lê, kiếm hoàng gia, ba loại cung... mỗi loại có bộ chiêu riêng. Cường hóa tới +9 bằng Đá Rèn I–III; vũ khí đặc biệt lấy từ boss cường hóa tới +5 bằng Đá Rèn U Ám.
- **Cung:** đánh thường bắn nhanh, đánh mạnh ngắm bắn xuyên qua kẻ địch. Mũi tên có hạn, nạp lại khi nghỉ ở Ân Điển.
- **10 phép:** Đá Sao, Mảnh Pha Lê, Lưỡi Kiếm Ánh Trăng, Sao Chổi Pha Lê, Mưa Thiên Thạch (Trí Tuệ); Hồi Phục, Lửa Thiêng, Tia Sét, Phúc Lành Vàng, Phán Xét Vàng (Đức Tin). Ghi nhớ phép vào số ô giới hạn; Đá Ký Ức thêm ô.
- **Tro Chiến Tranh (kỹ năng vũ khí):** Đột Kích, Lốc Xoáy, Địa Chấn, Lưỡi Lửa, Lưỡi Thánh, Rút Kiếm, Mưa Tên; vũ khí boss có kỹ năng riêng không đổi được.
- **9 bộ giáp** với độ giảm sát thương, độ trụ (đòn yếu không làm khựng) và trọng lượng. **Sức mang vác** quyết định kiểu lăn: nhẹ (nhanh, bất tử lâu), vừa, nặng (chậm), quá tải (không lăn được).
- **14 bùa hộ mệnh**, bắt đầu với 1 ô, Túi Bùa mở tới 4 ô.
- **Bình Máu và Bình FP:** chia tổng số bình giữa máu và FP ở Ân Điển. Hạt Vàng thêm bình (tối đa 10), Nước Mắt Thánh tăng lượng hồi (tối đa 5).
- **Vật phẩm dùng nhanh:** Bình Lửa, Dao Ném, Thuốc Giải Độc, Dầu Thánh, Rune Vàng.
- **Kẻ địch rơi đồ:** đá rèn, vật phẩm, đôi khi cả bộ giáp hiếm. Nhặt bằng `E`.
- **Điện Hội Ngộ:** nơi tụ họp, dịch chuyển tới từ bất kỳ Ân Điển nào. Có Thợ Rèn (cường hóa), Lái Buôn (vật phẩm, khiên, đá rèn), Học Giả (phép Trí Tuệ, gậy), Nữ Tu (phép Đức Tin, ấn).

## Thế giới

- **Miền trung:** Đồng Cỏ Sương Mờ, Tàn Tích Phía Tây, Đấu Trường Cổng Varek, Đầm Lầy Tro Độc.
- **Miền đông:** Cao Nguyên Tro Đông, Pháo Đài Đá Xám (giải đố lò lửa, tường ảo), Rừng Linh Hồn (bốn tượng đá, kết giới), Đấu Trường Thử Thách (ba đợt kẻ thù).
- **Miền tây:** Hồ Pha Lê (nước nông làm chậm bước, đảo nhỏ giữa hồ), Học Viện Pha Lê (hầm ngục lớn có cửa tắt mở bằng cần gạt, tường ảo, thư viện), Bờ Biển Muối.
- **Miền bắc:** Cao Nguyên Hoàng Kim và Sườn Núi Hoàng Kim; Kinh Thành Vàng (cổng lớn cần ba Đại Ấn, cửa hông mở bằng cần gạt bên trong, Sân Ngai Vàng), Cây Vàng ở tận cùng.
- **4 hầm ngục phụ**, mỗi hầm có ân điển, câu đố riêng và boss ở phòng cuối sau cửa sương: Hầm Mộ Ven Biển (cần gạt mở cửa đá), Mỏ Pha Lê (tường pha lê ảo), Hang Tro (bẫy lửa phun theo nhịp), Hầm Mộ Hoàng Gia (tường ảo).
- **Boss:** Varek (2 phase), Varek Vua Ẩn Mặt (2 phase), rồng Ignarth, Dornach (2 phase), Seluna, Selvara (2 phase, triệu hồi pháp sư, mưa thiên thạch), Kỵ Sĩ Mộ Phần, Khổng Lồ Pha Lê, Hộ Vệ Đá Cổ, Nhà Vô Địch Hoàng Gia, và trận cuối Aurel / Thú Vàng.
- **Kẻ địch mới:** Pháp Sư Học Viện (bắn mảnh pha lê, dịch chuyển né), Người Pha Lê, Chó Hồ, Kỵ Sĩ Hoàng Gia (sóng ánh thánh, nhảy bổ), Tu Sĩ Vàng (cột sáng, hồi máu cho đồng đội), Sư Tử Vàng, Cung Thủ Hoàng Gia (mưa tên).
- **Quái mạnh theo vùng đất**, không theo cấp người chơi (giống Elden Ring): từ +0% ở đồng cỏ tới +85–100% ở Kinh Thành và Cõi Vàng. Vùng khó hơn rơi nhiều rune hơn hẳn.
- **Bản đồ mở dần:** nơi tự đi qua mới hiện rõ. 11 **Bia Bản Đồ** đặt ở lối vào mỗi vùng chỉ mở bản đồ dạng phác thảo. Bí mật không bao giờ hiện trên bản đồ.
- **Ánh sáng và không khí theo vùng:** sương, tro, đom đóm, lá vàng, mặt hồ gợn sóng, sóng biển, tia nắng gần Cây Vàng. Chỉnh **Đồ họa: cao/thấp** trong menu tạm dừng.
- **Chết thì mất rune** tại chỗ; quay lại nhặt trước khi chết lần nữa. **Tự động lưu** vào `localStorage`.
- **Tên người chơi và bảng xếp hạng:** nhập tên khi bắt đầu hành trình mới. Hạ boss cuối thì kết quả được ghi vào bảng xếp hạng, xếp theo số lần chết (ít hơn đứng trên), bằng nhau thì ai phá đảo nhanh hơn đứng trên. Khi đã cấu hình Firebase (xem bên dưới) thì mọi người chung một bảng; nếu chưa, bảng chỉ lưu trên trình duyệt đó.

## Đăng lên mạng và bảng xếp hạng chung

### 1. Đăng game bằng GitHub Pages

1. Mở repo trên GitHub → **Settings** → **Pages**.
2. Mục **Build and deployment** → **Source**: chọn **Deploy from a branch**.
3. **Branch**: chọn `claude/elden-ring-uzx5c4`, thư mục `/ (root)` → **Save**.
4. Đợi khoảng 1–2 phút, trang Pages sẽ hiện link dạng `https://<tên-github>.github.io/Elden-Ring/`. Mỗi lần có commit mới trên nhánh này, trang tự cập nhật.

### 2. Tạo bảng xếp hạng chung bằng Firebase (miễn phí)

1. Vào [console.firebase.google.com](https://console.firebase.google.com) → **Create a project** (tắt Google Analytics cũng được).
2. Menu trái **Build** → **Firestore Database** → **Create database** → chọn vị trí gần (ví dụ `asia-southeast1`) → chọn **Start in production mode**.
3. Tab **Rules**: xóa hết nội dung cũ, dán toàn bộ file [`docs/firestore.rules`](docs/firestore.rules) → **Publish**. Luật này cho phép ai cũng xem bảng và gửi kết quả mới, nhưng không ai sửa hay xóa được kết quả đã gửi.
4. **Project settings** (bánh răng) → tab **General** → mục **Your apps** → bấm biểu tượng **Web** (`</>`) → đặt tên app → **Register app**. Firebase hiện đoạn `firebaseConfig`.
5. Chép `apiKey` và `projectId` trong đoạn đó vào [`src/config.js`](src/config.js) rồi commit. Khóa web của Firebase được thiết kế để nằm công khai trong trang; quyền đọc và ghi do luật ở bước 3 quyết định.

Khi `src/config.js` còn để trống, hoặc không kết nối được Firebase, game tự dùng bảng xếp hạng lưu trên trình duyệt của từng người.

## Cấu trúc

Các file script dùng chung phạm vi toàn cục và được nạp theo thứ tự trong `index.html`:

```
index.html          giao diện, menu, CSS
docs/firestore.rules luật bảo mật Firestore cho bảng xếp hạng
src/config.js       cấu hình Firebase cho bảng xếp hạng chung
src/core.js         tiện ích, canvas, âm thanh
src/world.js        bản đồ thế giới, vùng, tường, ân điển, rương, quái, hầm ngục, nền đất dựng sẵn
src/data.js         vũ khí, giáp, bùa, phép, tro chiến tranh, xuất thân, cửa hàng, kẻ địch
src/state.js        lưu game, chỉ số nhân vật, sát thương vũ khí, va chạm, hiệu ứng
src/input.js        bàn phím, chuột, cảm ứng, tay cầm
src/player.js       người chơi: đánh, cung, kỹ năng, phép, vật phẩm, gây sát thương
src/progression.js  túi đồ, nhận thưởng, lên cấp, cường hóa, cửa hàng, trang bị
src/enemies.js      AI kẻ địch và miniboss
src/bosses.js       Varek, rồng, trận cuối
src/content.js      phòng boss, bẫy, cần gạt, cửa hầm ngục, cổng lớn, NPC
src/systems.js      đạn, vùng sát thương, tương tác, vòng lặp chính
src/render.js       vẽ thế giới, ánh sáng, thời tiết
src/hud.js          HUD, bản đồ, menu Ân Điển, cửa hàng, khởi động
src/leaderboard.js  nhập tên, bảng xếp hạng
```
