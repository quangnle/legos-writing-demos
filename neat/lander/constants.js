const {
    Neat,
    architect,
    methods,
    config
} = neataptic;

// === NEAT Constants ===
const POPULATION_SIZE = 100;
const INPUT_SIZE = 7; // !!! Đã cập nhật thành 7 inputs (thêm gió) !!!
const OUTPUT_SIZE = 3; // Thrust Up, Left, Right

// === Lander Constants ===
const GRAVITY = 0.008; // Gia tốc trọng trường
const THRUST_POWER = 0.025; // Lực đẩy động cơ chính
const SIDE_THRUST_POWER = 0.015; // Lực đẩy động cơ ngang
const FUEL_PENALTY = 0.05; // Điểm phạt cho mỗi lần bật động cơ
const CRASH_PENALTY = -150; // Điểm phạt cơ bản khi rơi hỏng / bay ra ngoài
const SUCCESS_REWARD = 200; // Điểm thưởng cơ bản khi hạ cánh thành công
const SAFE_LANDING_VX = 1.0; // Vận tốc ngang tối đa cho phép khi hạ cánh
const SAFE_LANDING_VY = 1.5; // Vận tốc dọc tối đa cho phép khi hạ cánh
const MAX_STEPS = 800; // Số bước tối đa cho mỗi lần thử nghiệm
const DISTANCE_PENALTY_FACTOR = 100; // Hệ số phạt khoảng cách
const OOB_PENALTY = -2000; // Điểm phạt khi bay ra ngoài
const EXCESS_VX_PENALTY_FACTOR = 50; // Hệ số phạt cho vận tốc ngang vượt ngưỡng
const EXCESS_VY_PENALTY_FACTOR = 50; // Hệ số phạt cho vận tốc dọc vượt ngưỡng

// --- Thêm hằng số cho gió ---
const MAX_WIND_STRENGTH = 0.006; // Gia tốc ngang tối đa do gió
const WIND_NOISE_SCALE_TIME = 0.005; // Tốc độ thay đổi của gió theo thời gian
