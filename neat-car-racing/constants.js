// Car Constants
const CAR_WIDTH = 15; // pixels
const CAR_LENGTH = CAR_WIDTH * 2; // pixels
const MAX_SPEED = 4.5; // pixels per frame
const MIN_SPEED = 0; // pixels per frame (khi giảm tốc)
const ACCELERATION_RATE = 0.05; // Tăng tốc độ bao nhiêu mỗi frame
const DECELERATION_RATE = 0.1; // Giảm tốc độ bao nhiêu mỗi frame (phanh)
const NATURAL_DECELERATION = 0.01; // Tự giảm tốc nếu không làm gì (mô phỏng ma sát nhẹ)
const TURN_SPEED = 0.05; // radians per frame (khoảng 2.8 độ)

// Sensor Constants
const SENSOR_COUNT = 5;
const SENSOR_RANGE = 300; // pixels
const SENSOR_FOV_DEGREES = 180; // Field of View in degrees
const SENSOR_FOV_RADIANS = SENSOR_FOV_DEGREES * Math.PI / 180;

// Track Constants
const TRACK_STROKE_WEIGHT = 5; // Độ dày của đường viền đường đua
const TRACK_WAYPOINT_RADIUS = 20; // Bán kính của các điểm kiểm tra trên đường tâm (để tính quãng đường)
// Kích thước đường đua sẽ được tính toán trong sketch.js dựa trên canvas
// Chiều rộng lòng đường đua (không phải toàn bộ track)
const RACE_LANE_WIDTH = CAR_WIDTH * 12; // Chiều rộng của làn đường đua
const TRACK_CORNER_RADIUS = RACE_LANE_WIDTH * 0.8; // Bán kính bo góc của đường đua
const WAYPOINT_CAPTURE_RADIUS = CAR_WIDTH * 1.5; 

// Simulation Constants
const MAX_FRAMES_PER_GENERATION = 600; // Giới hạn thời gian cho mỗi thế hệ
const POPULATION_SIZE = 250;
const START_X_OFFSET = 100; // Vị trí bắt đầu của xe, tính từ lề trái của canvas
const START_Y_OFFSET_FACTOR = 0.5; // Vị trí bắt đầu của xe theo chiều dọc (0.5 là giữa)

// NEAT Constants
const INPUT_NODES = 3 + SENSOR_COUNT; // lap direction, vx, vy, sensor values
const OUTPUT_NODES = 4; // Tăng tốc, Giảm tốc (Phanh), Rẽ Trái, Rẽ Phải

// Colors
const CAR_COLOR = [255, 0, 0]; // Đỏ
const CAR_EXPLODED_COLOR = [50, 50, 50, 150]; // Xám mờ
const SENSOR_COLOR = [0, 255, 0, 100]; // Xanh lá cây mờ
const TRACK_COLOR = [100, 100, 100]; // Xám
const FINISH_LINE_COLOR = [255, 255, 255]; // Trắng
