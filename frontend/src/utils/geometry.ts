
export interface Keypoint {
    position: {
        x: number;
        y: number;
    };
}

/**
 * Calculates the angle between three points (A, B, C) where B is the vertex.
 */
export const calculateAngle = (
    a: Keypoint,
    b: Keypoint,
    c: Keypoint
): number => {
    const radians = Math.atan2(c.position.y - b.position.y, c.position.x - b.position.x) -
        Math.atan2(a.position.y - b.position.y, a.position.x - b.position.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);

    if (angle > 180.0) {
        angle = 360.0 - angle;
    }

    return angle;
};

/**
 * Calculates approximate spine angle relative to vertical axis.
 * Uses Mid-Shoulder and Mid-Hip points.
 */
export const calculateSpineAngle = (
    leftShoulder: Keypoint,
    rightShoulder: Keypoint,
    leftHip: Keypoint,
    rightHip: Keypoint
): number => {
    const midShoulderX = (leftShoulder.position.x + rightShoulder.position.x) / 2;
    const midShoulderY = (leftShoulder.position.y + rightShoulder.position.y) / 2;

    const midHipX = (leftHip.position.x + rightHip.position.x) / 2;
    const midHipY = (leftHip.position.y + rightHip.position.y) / 2;

    // Calculate angle against vertical axis
    const radians = Math.atan2(midHipY - midShoulderY, midHipX - midShoulderX);
    const angle = Math.abs(radians * 180.0 / Math.PI);

    // 90 degrees would be horizontal, 0 vertical? 
    // Custom logic: Address position usually ~35-40 degrees form vertical
    return Math.abs(90 - angle);
};
