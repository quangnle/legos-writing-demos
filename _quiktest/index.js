const pyramid = [
    [6],
    [3, 5],
    [11, 7, 7],
    [5, 9, 8, 10],
    [6, 4, 6, 12, 5],
    [8, 12, 11, 14, 17, 9]
];

const nLevels = pyramid.length;
const nPaths = 2**(pyramid.length - 1);

let minValue = Infinity;
let path = [];
for (let i=0; i < nPaths; i++){
    // this is to calculate the binary representation of the path
    let pathValue = i;
    // for each path, calculate the sum of the values
    let s = pyramid[0][0];
    // this is to store the path
    let currentPath = [pyramid[0][0]]; 
    // start from the top of the pyramid
    let currentRoomIndex = 0;
    for (let j = 0; j < nLevels - 1; j++){
        // if value is even, go left, else go right
        if (pathValue % 2 == 0){
            s += pyramid[j + 1][currentRoomIndex];
            currentPath.push(pyramid[j + 1][currentRoomIndex]);
        } else {
            currentRoomIndex++;
            s += pyramid[j + 1][currentRoomIndex];
            currentPath.push(pyramid[j + 1][currentRoomIndex]);
        }
        // this is to shift the path value to the right, equivalent to dividing by 2
        pathValue = pathValue >> 1; // (value = value / 2)
    }
    
    // check if the sum is less than the minimum value
    if (s < minValue){
        minValue = s;
        path = [...currentPath];
    }
}

console.log(minValue, path);