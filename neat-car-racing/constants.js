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

// Best Brain JSON -- dùng JSON object mình train được để gắn vào
const BEST_BRAIN = {
  "nodes": [
    {
      "bias": 0,
      "type": "input",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 0
    },
    {
      "bias": 0,
      "type": "input",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 1
    },
    {
      "bias": 0,
      "type": "input",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 2
    },
    {
      "bias": 0,
      "type": "input",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 3
    },
    {
      "bias": 0,
      "type": "input",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 4
    },
    {
      "bias": 0,
      "type": "input",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 5
    },
    {
      "bias": 0,
      "type": "input",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 6
    },
    {
      "bias": 0,
      "type": "input",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 7
    },
    {
      "bias": 0,
      "type": "input",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 8
    },
    {
      "bias": 0.08749909474475723,
      "type": "output",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 9
    },
    {
      "bias": -0.005398836990235134,
      "type": "output",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 10
    },
    {
      "bias": -0.05769949845996421,
      "type": "output",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 11
    },
    {
      "bias": 0.023732943956212865,
      "type": "output",
      "squash": "LOGISTIC",
      "mask": 1,
      "index": 12
    }
  ],
  "connections": [
    {
      "weight": 0.8835953591848161,
      "from": 8,
      "to": 12,
      "gater": null
    },
    {
      "weight": 1.460603339873357,
      "from": 7,
      "to": 12,
      "gater": null
    },
    {
      "weight": 4.191711472700998,
      "from": 8,
      "to": 11,
      "gater": null
    },
    {
      "weight": 2.292404383532508,
      "from": 6,
      "to": 12,
      "gater": null
    },
    {
      "weight": 1.1985130922550487,
      "from": 7,
      "to": 11,
      "gater": null
    },
    {
      "weight": 0.9110474557300031,
      "from": 8,
      "to": 10,
      "gater": null
    },
    {
      "weight": 2.862650949262271,
      "from": 5,
      "to": 12,
      "gater": null
    },
    {
      "weight": 1.0808458504072544,
      "from": 6,
      "to": 11,
      "gater": null
    },
    {
      "weight": 1.0256409271297744,
      "from": 7,
      "to": 10,
      "gater": null
    },
    {
      "weight": 3.299740078607074,
      "from": 8,
      "to": 9,
      "gater": null
    },
    {
      "weight": 1.8990327074878788,
      "from": 4,
      "to": 12,
      "gater": null
    },
    {
      "weight": 0.852556173144762,
      "from": 5,
      "to": 11,
      "gater": null
    },
    {
      "weight": 1.9737392130881235,
      "from": 6,
      "to": 10,
      "gater": null
    },
    {
      "weight": 3.1994657460824225,
      "from": 7,
      "to": 9,
      "gater": null
    },
    {
      "weight": 1.415118134849149,
      "from": 3,
      "to": 12,
      "gater": null
    },
    {
      "weight": 3.536301454945648,
      "from": 4,
      "to": 11,
      "gater": null
    },
    {
      "weight": 3.0591135011490374,
      "from": 5,
      "to": 10,
      "gater": null
    },
    {
      "weight": 1.3501274960158356,
      "from": 6,
      "to": 9,
      "gater": null
    },
    {
      "weight": 1.9833787363329234,
      "from": 2,
      "to": 12,
      "gater": null
    },
    {
      "weight": 3.757548505475826,
      "from": 3,
      "to": 11,
      "gater": null
    },
    {
      "weight": 1.7624359373098892,
      "from": 4,
      "to": 10,
      "gater": null
    },
    {
      "weight": 1.7359112570998394,
      "from": 5,
      "to": 9,
      "gater": null
    },
    {
      "weight": 0.23882560269531428,
      "from": 1,
      "to": 12,
      "gater": null
    },
    {
      "weight": 2.2789158123151547,
      "from": 2,
      "to": 11,
      "gater": null
    },
    {
      "weight": 2.203466031588588,
      "from": 3,
      "to": 10,
      "gater": null
    },
    {
      "weight": 4.131653354543265,
      "from": 4,
      "to": 9,
      "gater": null
    },
    {
      "weight": 1.5227295715922342,
      "from": 0,
      "to": 12,
      "gater": null
    },
    {
      "weight": 1.0544851218417608,
      "from": 1,
      "to": 11,
      "gater": null
    },
    {
      "weight": 0.2457591807753072,
      "from": 2,
      "to": 10,
      "gater": null
    },
    {
      "weight": 1.6690822670705978,
      "from": 3,
      "to": 9,
      "gater": null
    },
    {
      "weight": 2.4397128578639182,
      "from": 0,
      "to": 11,
      "gater": null
    },
    {
      "weight": 2.0369227953114506,
      "from": 1,
      "to": 10,
      "gater": null
    },
    {
      "weight": 1.9461209189436601,
      "from": 2,
      "to": 9,
      "gater": null
    },
    {
      "weight": 3.4258884160520995,
      "from": 0,
      "to": 10,
      "gater": null
    },
    {
      "weight": 3.6834503384516952,
      "from": 1,
      "to": 9,
      "gater": null
    },
    {
      "weight": 1.1550424399855483,
      "from": 0,
      "to": 9,
      "gater": null
    }
  ],
  "input": 9,
  "output": 4,
  "dropout": 0
}


