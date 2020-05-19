<?php
header('Content-Type: text/event-stream');
header('Cache-Control: no-cache');

if (isset($_REQUEST['code'])) {
    $fp = fopen('data.dat', "w");
    fputs($fp, $_REQUEST['code']);
    fclose($fp);
}
else {
    while (true) {
        $code = file_get_contents("data.dat");

        if (strcmp($code, $_SESSION['code']) != 0) {
            echo "data: $code\n\n";
        }

        $_SESSION['code'] = $code;

        ob_flush();
        flush();
    }
}

?>