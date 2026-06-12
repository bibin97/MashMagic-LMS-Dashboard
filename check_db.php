<?php
$conn = new mysqli('127.0.0.1', 'root', 'MashMagic2026!', 'mashmagic');
if ($conn->connect_error) {
    die('Connection failed: ' . $conn->connect_error);
}
$res = $conn->query("SELECT status, mentorship_completed, name FROM students");
$active = 0;
$completed = 0;
while($row = $res->fetch_assoc()) {
    if($row['status'] == 'active' && $row['mentorship_completed'] == 0) $active++;
    if($row['mentorship_completed'] == 1) $completed++;
}
echo json_encode(['active' => $active, 'completed' => $completed]);
?>
