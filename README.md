# Gravebound

Game hành động **souls-like 2D** chạy trên trình duyệt, lấy cảm hứng từ Elden Ring. Code viết tay bằng HTML5 Canvas và JavaScript thuần: không cần thư viện, không cần bước build, và âm thanh được tổng hợp bằng WebAudio.

> Game do người hâm mộ tự làm. Không liên quan tới FromSoftware hay Bandai Namco.

## Truyền thuyết

Suốt một ngàn năm, Cây Aurum giữ Vòng Aurum, và mọi linh hồn khi chết đều trở về với rễ cây. Rồi một đêm không trăng, Vòng vỡ tan. Những mảnh lớn nhất, gọi là Đại Ấn, rơi vào tay những kẻ mạnh nhất vùng đất. Từ đó người chết không còn đường về: họ bị trói lại nơi nấm mồ, rồi một ngày lại bò lên từ đất lạnh. Người ta gọi họ là **Gravebound**.

Người chơi là một Gravebound được Ân Điển đánh thức. Màn hình chính không giải thích mục tiêu: cốt truyện được kể dần trong game qua lời thoại, lời nhắn trên mặt đất và Nhật ký hành trình. Toàn bộ truyền thuyết nằm ở nút **Truyền thuyết** trên màn hình chính và trong menu tạm dừng.

## Chơi thế nào

Mở `index.html` bằng trình duyệt là chơi được. Nếu muốn chạy qua server tĩnh:

```bash
python3 -m http.server 8000
# rồi mở http://localhost:8000
```

**Mục tiêu (có tiết lộ nội dung):** chọn xuất thân, rời Nhà Nguyện Dawnrest, hạ **Varek** ở cổng phía bắc, rồi thu thập đủ **ba Đại Ấn**:

- **Đại Ấn Greystone** từ Dornach trong Pháo Đài Greystone (phía đông, giải đố lò lửa để vào).
- **Đại Ấn Rồng Tro** từ rồng Ignarth trong Đầm Lầy Ashmire.
- **Đại Ấn Trăng Pha Lê** từ Selvara, nữ hoàng của Học Viện Starhollow bên Hồ Crystalmere (phía tây, cần Chìa Khóa Pha Lê trên một hòn đảo giữa hồ).

Đủ ba Đại Ấn thì cổng **Kinh Thành Aurumhold** trên Cao Nguyên Aurelia mở ra. Trong Kinh Thành, Varek trở lại với hình dạng thật là **Vua Ẩn Mặt**. Hạ hắn để tới **Cây Aurum**, rồi vượt qua trận cuối hai giai đoạn ở Cõi Aurum.

## Độ khó

Độ khó được chọn **một lần** khi bắt đầu hành trình và giữ nguyên tới cuối. Muốn đổi thì bắt đầu Hành trình mới (nút ở màn hình chính, menu tạm dừng hoặc màn kết thúc).

| Độ khó | Mở từ đầu | Khác biệt |
|---|---|---|
| Dễ | có | Quái yếu hơn, ra đòn thưa hơn, boss ít máu hơn. |
| Thường | có | Trải nghiệm như dự định. |
| Khó | sau lần phá đảo đầu tiên | Quái và boss mạnh hơn nhiều, rune ×1.5. Khoảng 1/5 số quái là **tinh anh** mang thuộc tính. Hai **Gravebound Đỏ** xâm nhập thế giới. Varek gọi **Lời Thề Cũ** khi sang giai đoạn 2. Có lời nhắn từ chính ngươi ở chu kỳ trước. |
| Chuyên gia | sau lần phá đảo đầu tiên | Mạnh hơn nữa, rune ×2. Gần một nửa số quái là tinh anh, có kẻ mang hai thuộc tính. Thêm kẻ xâm nhập thứ ba. |

- **Thuộc tính tinh anh:** Hỏa Ngục (nổ tung khi chết), Cuồng Phong (nhanh, đánh dồn dập), Thạch Giáp (máu trâu, khó làm lảo đảo), Huyết Khế (đánh trúng thì hồi máu), Hư Ảnh (dịch chuyển ra sau lưng). Quái tinh anh cho gấp 2.5 lần rune và hay rơi đá cường hóa.
- **Gravebound Đỏ:** Morrow, Kẻ Săn Ấn (Đồng Cỏ Mistveil), Isolde Mắt Đỏ (Hồ Crystalmere) và Brannoc Bội Ước (Cao Nguyên Aurelia, chỉ ở Chuyên gia). Chúng đánh combo nhanh, ném dao, lướt ra sau lưng và uống bình máu. Hạ được mỗi kẻ sẽ nhận một bùa chỉ có ở hai độ khó này: Ấn Gravebound Đỏ, Tim Tro Tàn, Mảnh Vương Miện Vỡ.
- Dấu mở khóa được lưu riêng trong trình duyệt, nên xoá hành trình cũ vẫn giữ được. Bảng xếp hạng có tab riêng cho từng độ khó.

## Gợi ý theo tình huống

Không có màn hướng dẫn bắt buộc. Game chỉ hiện phím cần dùng đúng lúc cần, mỗi loại một lần: khi kẻ địch lao tới (đánh, lăn), khi bị tấn công (đỡ), khi máu còn một nửa (`R` uống Bình Máu), khi sắp hết thể lực, khi đứng ở Ân Điển, khi đủ rune lên cấp, khi rơi rune lúc chết, khi có trang bị mới (`I`) và khi đọc Bia Bản Đồ đầu tiên (`G`).

## Thành tựu

24 thành tựu (boss, Đại Ấn, hầm ngục, bản đồ, phản đòn, kẻ xâm nhập, phá đảo từng độ khó, không chết, dưới 2 giờ...). Mở khóa hiện thông báo ở góc trên bên phải; xem danh sách ở nút **Thành tựu** trên màn hình chính hoặc menu tạm dừng. Thành tựu lưu trên trình duyệt và giữ qua mọi hành trình.

## Lăn né, đỡ và phản đòn

- **Lăn** theo hướng đang di chuyển, có khung bất tử (bóng mờ phía sau nhân vật chính là lúc bất tử). Tốc độ lăn giảm dần mượt; giáp càng nặng lăn càng chậm và ít khung bất tử. Gần cuối cú lăn có thể nối ngay đòn đánh, lăn tiếp hoặc uống bình.
- **Đứng yên mà bấm lăn** thì nhảy lùi: nhanh, tốn ít thể lực nhưng khung bất tử ngắn.
- **Đỡ** bằng khiên khi giữ nút đỡ. Khoảnh khắc đầu tiên khi vừa giơ khiên là khung **phản đòn**: trúng đúng lúc thì kẻ địch mất thế, thời gian chậm lại một nhịp.
- **Đòn chí mạng:** bấm đánh thường khi đứng trước kẻ địch đang mất thế (sau phản đòn hoặc bị phá thế), hoặc sau lưng kẻ địch chưa ra đòn. Nhân vật tự vào vị trí, bất tử suốt hoạt ảnh và gây sát thương cực lớn.
- **Phản công sau khi đỡ (Guard Counter):** vừa đỡ trúng một đòn thì bấm đánh mạnh ngay để ra đòn nhanh, mạnh và phá thế gấp đôi.

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
| Hành trang (trang bị, túi đồ, trạng thái, dịch chuyển) | `I` hoặc `Tab` | Start → Hành trang |
| Bản đồ (bấm vào bản đồ để đặt / gỡ dấu) | `G` | Back / Share |
| Tạm dừng / âm thanh | `Esc` / `M` | Start |

Chỉ dùng bàn phím: `J` đánh thường, `K` đánh mạnh, giữ `X` để đỡ hoặc niệm phép, `C` dùng kỹ năng. Trên điện thoại, game tự hiện cần điều khiển ảo và các nút bấm.

## Phát triển nhân vật

- **Hành trang mở ở bất cứ đâu** (`I`, `Tab`, nút Túi trên điện thoại, hoặc menu tạm dừng); game tạm dừng khi mở. Như Elden Ring: đổi vũ khí, giáp, bùa ở đâu cũng được; lên cấp, ghi nhớ phép, gắn Tro Chiến Tranh và chia bình chỉ làm ở Ân Điển. Túi đồ cho xem mô tả, chọn đồ cho ô nhanh và dùng thuốc giải độc, dầu thánh, rune vàng. Tab Trạng thái có **nhật ký hành trình** chỉ mục tiêu tiếp theo.
- **Lên cấp có nút +/−:** cộng thử điểm, xem trước máu, thể lực, sức công phá thay đổi ra sao, rồi bấm **Xác nhận** mới trừ rune. Rời Ân Điển mà chưa xác nhận thì điểm được hủy.
- **Dịch chuyển nhanh từ Hành trang** tới Ân Điển đã tìm thấy khi không đang giao chiến; không hồi máu và không làm quái hồi sinh.
- **Dấu bản đồ:** bấm vào bản đồ để đặt dấu, trên màn hình có mũi tên chỉ hướng và khoảng cách; dấu tự gỡ khi tới nơi.

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
- **Sảnh Hearthhold:** nơi tụ họp, dịch chuyển tới từ bất kỳ Ân Điển nào. Có Thợ Rèn (cường hóa), Lái Buôn (vật phẩm, khiên, đá rèn), Học Giả (phép Trí Tuệ, gậy), Nữ Tu (phép Đức Tin, ấn).

## Thế giới

- **Miền trung:** Đồng Cỏ Mistveil, Tàn Tích Hollowmere, Cổng Gác Thornwall, Đầm Lầy Ashmire.
- **Miền đông:** Cao Nguyên Cinderreach, Pháo Đài Greystone (giải đố lò lửa, tường ảo), Rừng Wraithwood (bốn tượng đá, kết giới), Đấu Trường Bloodsand (ba đợt kẻ thù).
- **Miền tây:** Hồ Crystalmere (nước nông làm chậm bước, đảo nhỏ giữa hồ), Học Viện Starhollow (hầm ngục lớn có cửa tắt mở bằng cần gạt, tường ảo, thư viện), Bờ Biển Saltreach.
- **Miền bắc:** Cao Nguyên Aurelia và Sườn Núi Goldspire; Kinh Thành Aurumhold (cổng lớn cần ba Đại Ấn, cửa hông mở bằng cần gạt bên trong, Sân Ngai Sunthrone), Cây Aurum ở tận cùng.
- **4 hầm ngục phụ**, mỗi hầm có ân điển, câu đố riêng và boss ở phòng cuối sau cửa sương: Hầm Mộ Tidewrack (cần gạt mở cửa đá), Mỏ Shardvein (tường pha lê ảo), Hang Emberdeep (bẫy lửa phun theo nhịp), Hầm Mộ Kingsrest (tường ảo).
- **Boss:** Varek (2 phase), Varek Vua Ẩn Mặt (2 phase), rồng Ignarth, Dornach (2 phase), Seluna, Selvara (2 phase, triệu hồi pháp sư, mưa thiên thạch), Kỵ Sĩ Mộ Phần, Khổng Lồ Pha Lê, Hộ Vệ Đá Cổ, Nhà Vô Địch Hoàng Gia, và trận cuối Aurel / Thú Aurum.
- **Kẻ địch mới:** Pháp Sư Học Viện (bắn mảnh pha lê, dịch chuyển né), Người Pha Lê, Chó Hồ, Kỵ Sĩ Hoàng Gia (sóng ánh thánh, nhảy bổ), Tu Sĩ Vàng (cột sáng, hồi máu cho đồng đội), Sư Tử Vàng, Cung Thủ Hoàng Gia (mưa tên).
- **Quái mạnh theo vùng đất**, không theo cấp người chơi (giống Elden Ring): từ +0% ở đồng cỏ tới +85–100% ở Kinh Thành và Cõi Aurum. Vùng khó hơn rơi nhiều rune hơn hẳn.
- **Bản đồ mở dần:** nơi tự đi qua mới hiện rõ. 11 **Bia Bản Đồ** đặt ở lối vào mỗi vùng chỉ mở bản đồ dạng phác thảo. Bí mật không bao giờ hiện trên bản đồ.
- **Gợi ý tương tác:** mọi thứ bấm `E` được (bia, rương, vật phẩm, lời nhắn, cần gạt, lò lửa, NPC, cửa hầm) đều có dấu sáng nổi phía trên kèm tên, và hiện phím `E` khi đứng đủ gần. Bia Bản Đồ chưa đọc có cột sáng xanh nhìn thấy từ xa và được đánh dấu trên bản đồ. Lần đầu gặp mỗi loại, game nhắc cách dùng một lần.
- **Nhật ký hành trình** chỉ hiện những mục tiêu nhân vật đã nghe nói tới; phần còn lại lộ dần theo cốt truyện.
- **Ánh sáng và không khí theo vùng:** sương, tro, đom đóm, lá vàng, mặt hồ gợn sóng, sóng biển, tia nắng gần Cây Aurum. Chỉnh **Đồ họa: cao/thấp** trong menu tạm dừng.
- **Chết thì mất rune** tại chỗ; quay lại nhặt trước khi chết lần nữa. **Tự động lưu** vào `localStorage`.
- **Tên người chơi và bảng xếp hạng:** nhập tên khi bắt đầu hành trình mới. Hạ boss cuối thì kết quả được ghi vào bảng xếp hạng, xếp theo số lần chết (ít hơn đứng trên), bằng nhau thì ai phá đảo nhanh hơn đứng trên. Khi đã cấu hình Firebase (xem bên dưới) thì mọi người chung một bảng; nếu chưa, bảng chỉ lưu trên trình duyệt đó.

## Đăng lên mạng và bảng xếp hạng chung

### 1. Đăng game bằng GitHub Pages

1. Mở repo trên GitHub → **Settings** → **Pages**.
2. Mục **Build and deployment** → **Source**: chọn **Deploy from a branch**.
3. **Branch**: chọn `claude/elden-ring-uzx5c4`, thư mục `/ (root)` → **Save**.
4. Đợi khoảng 1–2 phút, trang Pages sẽ hiện link dạng `https://<tên-github>.github.io/<tên-repo>/`. Mỗi lần có commit mới trên nhánh này, trang tự cập nhật.

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
