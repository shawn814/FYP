"use strict"
// ================ Global variables =================
let choosen_id = null;
let points = [];   // Used in Draw Line

let app = new Vue({
    el: '#main',
    data: {
        type: "pen",
        code: ""
    },
    components: {

    },
    methods: {
        menu: function () {
            if (this.type == "cursor") {
                // Resize =========================================================================
                // $("#resize_nw").on('pointerdown', function (e) {

                // });

                // $("#resize_n").on('pointerdown', function (e) {

                // });

                // $("#resize_ne").on('pointerdown', function (e) {

                // });

                // $("#resize_e").on('pointerdown', function (e) {
                //     cursorPosition.x = e.clientX;
                //     cursorPosition.y = e.clientY;
                //     resizable = true;
                //     dragable = false;
                // });

                // $("#resize_se").on('pointerdown', function (e) {

                // });

                // $("#resize_s").on('pointerdown', function (e) {

                // });

                // $("#resize_sw").on('pointerdown', function (e) {

                // });

                // $("#resize_w").on('pointerdown', function (e) {

                // });
            }
        },
        upload: async (e) => {  // upload image
            let f = e.target.files[0];
            let svg = $('svg#draw').attr("viewBox").split(" ");
            if (f && f.type.startsWith('image/')) {
                // TODO: Use async-await syntax
                let url = await crop(f, svg[2], svg[3], 'dataURL', 'image/webp');
                let newPath = document.createElementNS("http://www.w3.org/2000/svg", "image");
                newPath.setAttribute('id', uuidv4());
                newPath.setAttribute('href', url);
                $("#draw").append(newPath);
            }
        },
        save: function (e) {

        }
    },
    computed: {

    },
    created() {
        $("#resize_wrap").hide();
    },
    mounted() {
        let coordinates = [];
        let newPath; // svg path

        // Coordinate variables
        let cursorPosition = null;
        let differentPosition = null;
        let position = null;
        let scale = { x: 1.00, y: 1.00 };
        let current_scale = { x: 1.00, y: 1.00 };

        // Flag
        let drag = false;
        let resize = false;

        let svgDraw = document.querySelector('svg#draw')

        window.requestAnimationFrame(update); // update by frame

        $("svg#draw").on('pointerdown pointerenter', function (e) {
            if (e.buttons == 1 && e.originalEvent.isPrimary) {
                e.preventDefault();
                let current_position = cursorPoint(e);

                switch (app.type) {
                    case "pen":         // Draw
                        unselect();
                        break;
                    case "cursor":      // Move
                        if (e.target.tagName == "path") {
                            choosen_id = e.target.id;
                            $('#resize_wrap').show();
                            selected_border($(`#${choosen_id}`)[0].getBBox());
                            position = { x: 0, y: 0 };
                            cursorPosition = current_position;
                            drag = true;
                        }
                        break;
                    case "text":        // Textbox

                        break;
                    case "rect":        // Rectangle
                        unselect();
                        cursorPosition = { x: current_position.x, y: current_position.y };
                        break;
                    case "circle":      // Circle
                        unselect();
                        cursorPosition = { x: current_position.x, y: current_position.y };
                        break;
                    case "line":        // Line
                        unselect();
                        break;
                    default:
                        break;
                }
            }
        });

        $("svg#draw").on('pointermove', function (e) {
            if (e.buttons == 1 && e.originalEvent.isPrimary) {
                e.preventDefault();
                let current_position = cursorPoint(e);

                switch (app.type) {
                    case "pen":         // Draw
                        if (!newPath) {
                            coordinates.push({ x: current_position.x - e.originalEvent.movementX, y: current_position.y - e.originalEvent.movementY });
                            coordinates.push({ x: current_position.x, y: current_position.y });
                            coordinates = coordinates.slice(-2);

                            newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                            newPath.setAttribute('id', uuidv4());
                            newPath.setAttribute('d', `M${simplifyNumber(coordinates[0].x)},${simplifyNumber(coordinates[0].y)}`);

                            $("svg#draw").append(newPath);
                        } else if (current_position.x != coordinates[1].x || current_position.y != coordinates[1].y) {
                            coordinates.push({ x: current_position.x, y: current_position.y });
                            coordinates = coordinates.slice(-3);

                            newPath.setAttribute('d',
                                `${newPath.getAttribute('d')}Q${simplifyNumber(coordinates[1].x)},${simplifyNumber(coordinates[1].y)},${simplifyNumber(mid(coordinates[1], coordinates[2]).x)},${simplifyNumber((mid(coordinates[1], coordinates[2]).y))}`
                            );
                        }
                        break;
                    case "cursor":      // Move
                        if (!choosen_id) break;

                        if (drag) {
                            $(`#${choosen_id},#resize_wrap`).css('transform',
                                `translate(${current_position.x - cursorPosition.x}px,${current_position.y - cursorPosition.y}px)`
                            );
                        }
                        else if (resize) {
                            selected_border($(`#${choosen_id}`)[0].getBBox());

                            differentPosition.x = current_position.x - (selected_info.x + selected_info.width);
                            current_scale.x = (differentPosition.x + selected_info.width) / selected_info.width;

                            $(`#${choosen_id}`).css(
                                'transform',
                                `translate(${selected_info.x}px,${selected_info.y}px) scale(${current_scale.x},${current_scale.y}) translate(-${selected_info.x}px,-${selected_info.y}px)`
                            );
                        }
                        break;
                    case "text":        // Textbox

                        break;
                    case "rect":        // Rectangle
                        if ($.isEmptyObject(differentPosition)) {
                            newPath = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                            newPath.setAttribute('id', uuidv4());
                            newPath.setAttribute('x', cursorPosition.x);
                            newPath.setAttribute('y', cursorPosition.y);

                            $("svg#draw").append(newPath);
                        }

                        differentPosition = { x: current_position.x - cursorPosition.x, y: current_position.y - cursorPosition.y };

                        if (differentPosition.x < 0 && differentPosition.y < 0) {
                            newPath.setAttribute("x", current_position.x);
                            newPath.setAttribute("y", current_position.y);
                            newPath.setAttribute('width', cursorPosition.x - current_position.x);
                            newPath.setAttribute('height', cursorPosition.y - current_position.y);
                        } else if (differentPosition.x < 0) {
                            newPath.setAttribute("x", current_position.x);
                            newPath.setAttribute("y", cursorPosition.y);
                            newPath.setAttribute("width", cursorPosition.x - current_position.x);
                            newPath.setAttribute('height', differentPosition.y);
                        } else if (differentPosition.y < 0) {
                            newPath.setAttribute("y", current_position.y);
                            newPath.setAttribute("x", cursorPosition.x);
                            newPath.setAttribute('width', differentPosition.x);
                            newPath.setAttribute('height', cursorPosition.y - current_position.y);
                        } else {
                            newPath.setAttribute("x", cursorPosition.x);
                            newPath.setAttribute("y", cursorPosition.y);
                            newPath.setAttribute('width', differentPosition.x);
                            newPath.setAttribute('height', differentPosition.y);
                        }
                        break;
                    case "circle":      // Circle
                        if (!newPath) { // check new elemen
                            newPath = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
                            newPath.setAttribute('id', uuidv4());
                            newPath.setAttribute('cx', cursorPosition.x);
                            newPath.setAttribute('cy', cursorPosition.y);

                            $("svg#draw").append(newPath);    // add into svg
                        }

                        differentPosition = { x: Math.abs(current_position.x - cursorPosition.x), y: Math.abs(current_position.y - cursorPosition.y) };

                        // Prefect circle ===================================================
                        if (e.shiftKey) differentPosition.x > differentPosition.y ? differentPosition.y = differentPosition.x : differentPosition.x = differentPosition.y

                        // Set circle size ==================================================
                        newPath.setAttribute('rx', differentPosition.x / 2);
                        newPath.setAttribute('ry', differentPosition.y / 2);

                        // Fix position =====================================================
                        if (current_position.x - cursorPosition.x < 0 && current_position.y - cursorPosition.y < 0) {  // left top
                            newPath.setAttribute('cx', cursorPosition.x - differentPosition.x / 2);
                            newPath.setAttribute('cy', cursorPosition.y - differentPosition.y / 2);
                        }
                        else if (current_position.x - cursorPosition.x < 0) {   // left
                            newPath.setAttribute('cx', cursorPosition.x - differentPosition.x / 2);
                            newPath.setAttribute('cy', cursorPosition.y + differentPosition.y / 2);
                        }
                        else if (current_position.y - cursorPosition.y < 0) {  /// top
                            newPath.setAttribute('cx', cursorPosition.x + differentPosition.x / 2);
                            newPath.setAttribute('cy', cursorPosition.y - differentPosition.y / 2);
                        }
                        else {  // bottom right
                            newPath.setAttribute('cx', cursorPosition.x + differentPosition.x / 2);
                            newPath.setAttribute('cy', cursorPosition.y + differentPosition.y / 2);
                        }
                        break;
                    case "line":        // Line
                        let newPoint = comparePoint(current_position);
                        if (!newPath) {
                            cursorPosition = newPoint ? { x: newPoint.x, y: newPoint.y } : { x: current_position.x, y: current_position.y };
                            newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                            newPath.setAttribute('id', uuidv4());

                            $("svg#draw").append(newPath);
                        }
                        newPoint ? newPath.setAttribute('d', `M${cursorPosition.x},${cursorPosition.y},L${newPoint.x},${newPoint.y}`) :
                                   newPath.setAttribute('d', `M${cursorPosition.x},${cursorPosition.y},L${current_position.x},${current_position.y}`);
                        break;
                    default:
                        break;
                }
            }
        });

        $("svg#draw").on('pointerup pointerleave', function (e) {
            e.preventDefault();
            let current_position = cursorPoint(e);

            switch (app.type) {
                case "pen":         // Draw
                    if (newPath) {
                        coordinates.push({ x: current_position.x, y: current_position.y });
                        coordinates = coordinates.slice(-3);

                        newPath.setAttribute('d',
                            `${newPath.getAttribute('d')}Q${simplifyNumber(mid(coordinates[1], coordinates[2]).x)},${simplifyNumber((mid(coordinates[1], coordinates[2]).y))},${simplifyNumber(coordinates[2].x)},${simplifyNumber(coordinates[2].y)},`
                        );
                    }
                    coordinates = [];
                    newPath = null;
                    break;
                case "cursor":      // Move
                    if (e.target.tagName == "path" && choosen_id) {
                        const selected_css_value = $(`#${choosen_id}`).css('transform').split(',');

                        if (drag && selected_css_value != "none") {
                            position = { x: parseFloat(selected_css_value[4]), y: parseFloat(selected_css_value[5]) };

                            const coord = $(`#${choosen_id}`).attr('d').substring(1).split("Q");
                            let new_coord;

                            let i
                            for (i of coord) {
                                let coord_xy = i.split(",");
                                if ($.isNumeric(coord_xy[0]) && $.isNumeric(coord_xy[1])) {
                                    !new_coord ?
                                        new_coord = `M${(parseFloat(coord_xy[0]) + position.x).toFixed(2)},${(parseFloat(coord_xy[1]) + position.y).toFixed(2)}` :
                                        new_coord += `Q${(parseFloat(coord_xy[0]) + position.x).toFixed(2)},${(parseFloat(coord_xy[1]) + position.y).toFixed(2)},${(parseFloat(coord_xy[2]) + position.x).toFixed(2)},${(parseFloat(coord_xy[3]) + position.y).toFixed(2)}`;
                                }
                            }
                            $(`#${choosen_id}`).removeAttr('style');
                            $(`#${choosen_id}`).attr('d', new_coord);

                            selected_border($(`#${choosen_id}`)[0].getBBox());
                            $("#resize_wrap").removeAttr('style');
                        }
                    }
                    cursorPosition = position = null;
                    drag = false;
                    break;
                case "text":        // Textbox

                    break;
                case "rect":        // Rectangle
                    newPath = differentPosition = cursorPosition = null;
                    break;
                case "circle":      // Circle
                    newPath = differentPosition = cursorPosition = null;
                    break;
                case "line":        // Line
                    if (cursorPosition) {

                        points.push(cursorPosition);
                        points.push({ x: current_position.x, y: current_position.y });
                    }
                    newPath = cursorPosition = current_position = null;
                    break;
                default:
                    break;
            }
        });

        // Zoom in & out
        $("svg#draw").on('mousewheel keydown', function (e) {
            if (e.ctrlKey) {
                e.preventDefault();
                let scale = $("#draw,#grid_wrap")[0].getBoundingClientRect().width / $("#draw").width();
                if (e.originalEvent.wheelDelta / 120 > 0) {
                    if (scale < 5) $("#draw,#grid_wrap").css("transform", `scale(${(scale + 0.05).toFixed(2)})`);
                } else {
                    if (scale >= 0.1) $("#draw,#grid_wrap").css("transform", `scale(${(scale - 0.05).toFixed(2)})`);
                }
            }
        });

        // Delete selected object
        $(document).on('keydown', function (e) {
            if (e.keyCode == 8 || e.keyCode == 46 && choosen_id) {
                $(`#${choosen_id}`).remove();
                unselect();
            }
        });

        // Reset
        $("svg").click(function (e) {
            if (e.target.tagName != "path" && choosen_id) {
                unselect();
            }
        });
    }
});

/* ==================================== Update by frame ====================================== */
let rgb_H = 0;
let secondsPassed;
let oldTimeStamp;
let fps;

function unselect() {
    if (choosen_id) {
        $(`#${choosen_id}`).removeAttr("class");
        $("#resize_wrap").removeAttr('style').hide();
        choosen_id = null;
    }
}

function update(timeStamp) {
    // Calculate the number of seconds passed since the last frame
    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;

    // Calculate fps
    fps = Math.round(1 / secondsPassed);

    // Display fps
    fps > 20 ? $('#fps').html(`${fps}`).css("color", "green") :
               $('#fps').html(`${fps}`).css("color", "red");

    // RGB Stroke
    // $("#draw path:not(#resize_wrap *)").attr('stroke', `hsl(${rgb_H}, 100%, 50%)`);
    // rgb_H < 360 ? rgb_H++ : rgb_H = 0;
    // $("label#pen span").css("color", `hsl(${rgb_H}, 100%, 50%)`);

    window.requestAnimationFrame(update);
}

/* ==================================== Function ====================================== */
// Drawing function
function mid(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function drawCurve(a, b) {
    if (line_id) {
        $(`#${line_id}`).attr("d",
            `${$(`#${line_id}`).attr("d")}Q${simplifyNumber(a.x)},${simplifyNumber(a.y)},${simplifyNumber(b.x)},${simplifyNumber(b.y)}`
        );
    }
}

function simplifyNumber(n) {
    if (!$.isNumeric(n)) return;
    return n.toFixed(2) % 1 != 0 ? n.toFixed(2) : n.toFixed(0);
}

// Reset selected border coordinate
function selected_border(selected_info) {
    $("#resize_border").attr("x", selected_info.x - 5).attr("y", selected_info.y - 5).attr("width", selected_info.width + 10).attr("height", selected_info.height + 10);
    $("#resize_nw").attr("x", selected_info.x - 10).attr("y", selected_info.y - 10).css("cursor", "nw-resize");
    $("#resize_n").attr("x", selected_info.x + (selected_info.width / 2) - 5).attr("y", selected_info.y - 10).css("cursor", "n-resize");
    $("#resize_ne").attr("x", selected_info.x + selected_info.width).attr("y", selected_info.y - 10).css("cursor", "ne-resize");
    $("#resize_e").attr("x", selected_info.x + selected_info.width).attr("y", selected_info.y + (selected_info.height / 2) - 5).css("cursor", "e-resize");
    $("#resize_se").attr("x", selected_info.x + selected_info.width).attr("y", selected_info.y + selected_info.height).css("cursor", "se-resize");
    $("#resize_s").attr("x", selected_info.x + (selected_info.width / 2) - 5).attr("y", selected_info.y + selected_info.height).css("cursor", "s-resize");
    $("#resize_sw").attr("x", selected_info.x - 10).attr("y", selected_info.y + selected_info.height).css("cursor", "sw-resize");
    $("#resize_w").attr("x", selected_info.x - 10).attr("y", selected_info.y + (selected_info.height / 2) - 5).css("cursor", "w-resize");
}

function uuidv4() { // ID generator
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function comparePoint(cursor) { // Get the nearest point
    if (!points) return
    for (let point of points)
        if (cursor.x >= point.x - 10 && cursor.x <= point.x + 10 &&
            cursor.y >= point.y - 10 && cursor.y <= point.y + 10) return point;
}

/* ==================================== SVG Coordinate ====================================== */
let svg = document.querySelector('svg');    // Find your root SVG element
let pt = svg.createSVGPoint();  // Create an SVGPoint for future math

function cursorPoint(evt) {     // Get point in global SVG space
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}