# Vòng Vàng Vỡ

Game hành động **souls-like 2D** chạy trên trình duyệt, lấy cảm hứng từ Elden Ring. Code viết tay bằng HTML5 Canvas và JavaScript thuần: không cần thư viện, không cần bước build, và âm thanh được tổng hợp bằng WebAudio.

> Game do người hâm mộ tự làm. Không liên quan tới FromSoftware hay Bandai Namco.

## Chơi thế nào

Mở `index.html` bằng trình duyệt là chơi được. Nếu muốn chạy qua server tĩnh:

```bash
python3 -m http.server 8000
# rồi mở http://localhost:8000
```

Mục tiêu: rời Nhà Nguyện, băng qua Đồng Cỏ Sương Mờ, hạ gục **Varek, Kẻ Canh Cổng Phản Trắc**, đi qua cổng phía bắc tới **Cây Vàng**, rồi vượt qua trận cuối hai giai đoạn ở Cõi Vàng. Thử thách phụ: đánh thức **Ignarth, Rồng Tro Cổ Đại** trong Đầm Lầy Tro Độc, rồi đi xa hơn về phía đông để khám phá Pháo Đài Đá Xám, Rừng Linh Hồn và Đấu Trường Thử Thách.

## Điều khiển

Phím được đặt theo Elden Ring bản PC (bố cục mặc định trước bản mở rộng Shadow of the Erdtree). Game không có nút nhảy, nên `Space` dùng cho lăn và chạy như bản gốc.

| Hành động | Bàn phím / chuột | Tay cầm (Xbox / PlayStation) |
|---|---|---|
| Di chuyển | `W` `A` `S` `D` | cần trái |
| Lăn né | nhấn `Space` | nhấn B / ○ |
| Chạy nhanh | giữ `Space` | giữ B / ○ |
| Đánh thường | chuột trái | RB / R1 |
| Đánh mạnh | `Shift` + chuột trái | RT / R2 |
| Đỡ / phản đòn | giữ chuột phải | giữ LB / L1 |
| Phép Đá Sao (vị trí nút Skill) | `Shift` + chuột phải | LT / L2 |
| Uống Bình Máu | `R` | X / □ |
| Tương tác, mở rương | `E` | Y / △ |
| Khóa mục tiêu | `Q` hoặc chuột giữa | R3 |
| Đổi vũ khí | `←` `→` (hoặc `1`–`8`) | D-pad ← → |
| Gọi / xuống ngựa | `F` | A / × |
| Bản đồ | `G` | Back / Share |
| Tạm dừng | `Esc` | Start / Options |
| Tắt/bật âm thanh | `M` | |

Nếu chỉ chơi bằng bàn phím: `J` đánh thường, `K` đánh mạnh, giữ `X` để đỡ, `C` dùng phép. Trên điện thoại, game tự hiện cần điều khiển ảo và các nút bấm.

## Tính năng

- **Chiến đấu kiểu souls:** thanh thể lực, lăn né có khung bất tử, combo đòn nhẹ, đòn mạnh phá thế, đòn chí mạng khi kẻ địch mạnh bị mất thế, và bộ đệm lệnh để nối đòn mượt.
- **Đỡ và phản đòn:** giữ chuột phải để giơ khiên chặn phần lớn sát thương (tốn thể lực). Nếu giơ khiên đúng lúc kẻ địch vung vũ khí, bạn phản đòn và chúng mất thế, sẵn sàng cho một đòn chí mạng. Rồng không phản đòn được.
- **Mỗi vũ khí một bộ chiêu:**
  - Kiếm Thẳng: chém – chém – đâm; đòn mạnh bổ từ trên xuống.
  - Uchigatana: 2 nhát chém nhanh rồi xoay tròn; đòn mạnh là rút kiếm lướt chém.
  - Giáo: đâm – đâm – quét ngang; đòn mạnh lao tới đâm.
  - Kiếm Vàng Varek: đòn thứ 3 bổ xuống; đòn mạnh bổ xuống kèm sóng ánh vàng.
  - Đại kiếm: đòn thứ 3 bổ xuống; đòn mạnh xoay tròn.
  - Chùy: bổ xuống gây sát thương theo vùng; đòn mạnh đập đất rung chuyển.
  - Liềm: quét rộng rồi xoay; đòn mạnh xoay 2 vòng.
- **Vũ khí hai tay:** Kiếm Vàng Varek, Đại Kiếm Nanh Rồng, Chùy Vệ Binh và Liềm Hồn Ma phải cầm bằng hai tay nên không dùng khiên được. Khi đỡ đòn bằng thân vũ khí thì chặn kém hơn, tốn thể lực hơn và không phản đòn được. Bù lại, sát thương lớn và một số vũ khí không bị ngắt đòn.
- **Đâm lưng:** đánh vào sau lưng kẻ địch chưa phát hiện ra bạn sẽ gây sát thương chí mạng.
- **Vũ khí phải tự đi tìm:** bạn bắt đầu với Kiếm Gãy. Kiếm Thẳng, Uchigatana Tro (gây chảy máu) và Giáo Kỵ Sĩ (đâm xa) nằm trong rương, thường có kẻ địch canh giữ. Hạ Varek nhận Kiếm Vàng Varek (đòn mạnh phóng sóng ánh sáng), hạ rồng nhận Đại Kiếm Nanh Rồng, hạ Dornach nhận Chùy Vệ Binh, hạ Seluna nhận Liềm Hồn Ma (quét rộng, gây chảy máu). Đổi vũ khí bằng phím mũi tên hoặc ở tab Trang bị khi nghỉ tại Ân Điển.
- **Rương báu:** 15 rương rải rác khắp bản đồ, có rương chỉ xuất hiện sau khi giải đố hoặc vượt thử thách, chứa vũ khí, rune, Đá Rèn Kiếm và Hạt Vàng.
- **Bản đồ (`G`):** hiện các vùng, những Ân Điển đã tìm thấy, vị trí của bạn và chỗ rơi rune.
- **Kẻ địch:** mỗi loại có kỹ năng riêng, và mọi đòn đánh đều có thời gian vung báo trước.
  - Lính Tàn Binh, bầy Sói Xám, Kỵ Sĩ Tro Tàn (tinh anh, combo 2 đòn).
  - Pháp Sư Lưu Đày: bắn đạn phép.
  - Thây Ma Đầm Lầy: đánh trúng gây độc.
  - Cung Thủ Tàn Binh: bắn tên, có lúc bắn loạt 3 mũi.
  - Kẻ Ném Lửa: ném bom lửa nổ theo vùng, có vòng báo trước chỗ rơi.
  - Hồn Ma Lang Thang: dịch chuyển ra sau lưng bạn rồi chém.
  - Lính Khiên Sắt: chặn mọi đòn nhẹ từ phía trước. Hãy đánh vòng ra sau, dùng đòn mạnh hoặc phép.
  - Người Khổng Lồ Đá: vung chùy, đập đất tạo sóng xung kích, dậm chân.
  - Dơi Máu: bay vòng quanh rồi bổ nhào.
  - Nhện Độc: phun độc tạo vũng độc trên mặt đất, cắn gây độc.
- **Mini-boss:**
  - Dornach, Vệ Binh Pháo Đài: combo chùy, lao tới húc, đập đất.
  - Seluna, Nữ Vương Hồn Ma: dịch chuyển, bắn vòng cầu hồn, triệu hồi hồn ma.
- **Giải đố và khám phá:**
  - Thắp ba lò lửa trước Pháo Đài theo đúng đường đi của mặt trời để mở cổng. Thắp sai thứ tự thì lửa tắt và bạn bị bỏng.
  - Tìm và đánh thức bốn tượng đá ở bốn góc Rừng Linh Hồn để phá kết giới.
  - Tường ảo kiểu Elden Ring: đánh vào bức tường khả nghi để lộ phòng bí mật.
- **Đấu Trường Thử Thách:** chạm lá cờ để bắt đầu ba đợt kẻ thù, cổng sẽ đóng lại cho tới khi bạn thắng hoặc chết. Thắng thì mở ra rương thưởng.
- **Trận cuối ở Cõi Vàng (2 phase):**
  - Phase 1 — Aurel, Vị Vua Tro Tàn: combo chùy vàng kết thúc bằng cú đập đất, nhảy đập, cột ánh sáng dọc theo hướng bạn đứng, dịch chuyển ra sau lưng, vòng sáng lan tỏa. Đòn chùy phản đòn được.
  - Phase 2 — Thú Vàng: cầu sáng đuổi theo bạn, tia sáng quét ngang, ba vòng sóng liên tiếp, mưa sao rơi, bay lên rồi lao xuống. Dưới 40% máu thì đánh dồn dập hơn. Không phản đòn được.
- **Boss gác cổng hai giai đoạn:** Varek có đòn đánh chậm một nhịp, nhảy đập, ném dao vàng, và khi còn nửa máu thì dùng thêm búa vàng tạo sóng xung kích và mưa ánh sáng.
- **Rồng Ignarth (boss phụ):** phun lửa quét, bay lên rồi lao xuống, bắn cầu lửa, cắn liên hoàn, và quật đuôi nếu bạn đứng sau lưng. Khi còn dưới 40% máu thì nổi điên. Hạ rồng sẽ nhận được đại kiếm.
- **Đầm Lầy Tro Độc:** đứng trong ao tím sẽ tích độc, đầy thanh thì bị trúng độc và mất máu dần. Đi bằng ngựa sẽ không bị ảnh hưởng. Nghỉ ở Ân Điển để giải độc.
- **Ân Điển:** nghỉ ngơi để hồi máu và Bình Máu (kẻ địch cũng hồi sinh), lên cấp bằng rune, và dịch chuyển giữa các Ân Điển đã tìm thấy.
- **Chết thì mất rune:** rune rơi tại chỗ bạn chết. Quay lại nhặt trước khi chết lần nữa.
- **Độ khó:** quái có nhiều máu hơn và đánh đau hơn, rune rơi ít đi, lên cấp đắt hơn, Bình Máu hồi ít máu hơn.
- **Quái mạnh dần:** như Elden Ring, quái mạnh hơn theo vùng đất (vùng xa như phía đông, Cõi Vàng: máu và sát thương tới +35–50%). Ngoài ra, mỗi cấp người chơi làm quái tăng 3% máu và 2% sát thương; chỉ số này hiện trong menu lên cấp. Rune rơi ra cũng tăng theo.
- **Bình Máu:** bắt đầu với 3 bình, tối đa 8. Khi đã đủ, Hạt Vàng đổi thành rune.
- **Thế giới mở:** 10 vùng, 9 Ân Điển, Hạt Vàng (thêm lượt Bình Máu), Đá Rèn Kiếm (cường hóa vũ khí), lời nhắn gợi ý trên mặt đất, và ngựa linh để đi nhanh.
- **Tự động lưu** vào `localStorage` khi nghỉ ở Ân Điển, nhặt vật phẩm, chết hoặc hạ boss.

## Cấu trúc

```
index.html   giao diện, menu, CSS
game.js      toàn bộ logic: thế giới, người chơi, AI, boss, hiển thị, âm thanh
```
