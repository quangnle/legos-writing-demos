// generate all permutations with length n of the numbers nums
function permute(nums, len) {
    const result = [];
    const used = new Array(nums.length).fill(false);
    const current = new Array(len);
    function dfs(pos) {
        if (pos == len) {
            result.push([...current]);
            return;
        }
        for (let i = 0; i < nums.length; i++) {
            if (used[i]) {
                continue;
            }
            used[i] = true;
            current[pos] = nums[i];
            dfs(pos + 1);
            used[i] = false;
        }
    }
    dfs(0);
    return result;
}
