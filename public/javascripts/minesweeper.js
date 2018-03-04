let canvas = document.getElementById("mycanvas");
let drawing = canvas.getContext("2d");

let square_size = 50;
let squares_x = canvas.width / square_size;
let squares_y = canvas.height / square_size;
let game_ended = false;


function get_board_state_array() {
    // .fill has a bug if you do a .fill inside a .fill
    let ret = Array();
    for(let i in _.range(squares_x)){
        ret.push(Array(squares_y).fill(false))
    }
    return ret
}

let game_board = get_board_state_array();
let checked_squares = get_board_state_array();
let mines_percentage = 0.20;


drawing.fillStyle = "#DFDFDF";
drawing.fillRect(0, 0, canvas.width, canvas.height);



function seed_mines() {
    function get_rand_coords() {
        return {
            x: get_random_int(squares_x),
            y: get_random_int(squares_y)
        }
    }
    let mines = Math.floor((squares_x * squares_y) * mines_percentage);
    for(let i in _.range(mines)){
        let coord = get_rand_coords();
        while(game_board[coord.x][coord.y]){
            coord = get_rand_coords()
        }
        //console.log("set to true" + coord.x.toString() + coord.y.toString())
        game_board[coord.x][coord.y] = true
    }
}
seed_mines();

function Draw() {
    // draws the lines

    let _this = this;
    let draw_square = (x, y) => drawing.fillRect((x * square_size) + 1, (y* square_size) + 1, square_size - 2, square_size - 2);
    let draw_circle = (x, y) => {
        drawing.fillStyle = "#000000";
        let offset = Math.floor(square_size /2);
        drawing.moveTo(x, y);
        drawing.arc(x * square_size + offset, y* square_size + offset , Math.floor(square_size / 4), 0, 2 * Math.PI, false);
        drawing.fill();
    };
    let draw_end_game_text = (text) => {
        let fontsize = 125;
        drawing.font= fontsize + "px Arial";
        drawing.fillStyle = "#000000";
        drawing.textAlign = "center";
        drawing.fillText(text , canvas.width / 2, canvas.height / 2 + (fontsize /4)  );
        drawing.fill()
    };

    let reveal_board = () => {
        for (let i in _.range(checked_squares.length)){
            for (let j in _.range(checked_squares[i].length) ){
                if(!checked_squares[   i][j]){
                    if(game_board[i][j]){
                       _this.draw_mine(i, j)
                    }else{
                        reveal_square(i, j)
                    }
                }
            }
        }
    };

    this.reveal = function () {
        reveal_board()
    };

    this.draw_horz_lines = function () {
        for (let i = 1; i < squares_x; i++){
            let x_coord = square_size * i;
            drawing.moveTo(x_coord, 0);
            drawing.lineTo(x_coord, canvas.height);
            drawing.stroke()
        }
    };

    this.draw_vert_lines  = function () {
        for (let i = 1; i < squares_y; i++){
            let y_coord = square_size * i;
            drawing.moveTo(0, y_coord);
            drawing.lineTo(canvas.width, y_coord);
            drawing.stroke()
        }
    };

    this.draw_mine = function (x_coord, y_coord) {
        _this.draw_empty(x_coord, y_coord);
        drawing.fillStyle= "#C7535C";
        draw_circle(x_coord, y_coord)
    };

    this.draw_empty = function (x_coord, y_coord) {
        drawing.fillStyle = "#FFFFFF";
        draw_square(x_coord, y_coord)
    };

    this.draw_number = function (x_coord, y_coord, number) {
        _this.draw_empty(x_coord, y_coord);
        let offset = square_size / 2;
        let fontsize = offset;
        drawing.font= fontsize + "px Arial";
        drawing.fillStyle = "#000000";
        drawing.textAlign = "center";
        drawing.fillText(number.toString() , x_coord * square_size + offset, (y_coord * square_size) + offset + (fontsize /4)  , 100);
        drawing.fill()
    };

    this.draw_game_lost = () => {
        reveal_board();
        draw_end_game_text("You lost")
    };
    this.draw_game_won = () => {
        reveal_board();
        draw_end_game_text("You won")
    }

}

draw = new Draw();
draw.draw_horz_lines();
draw.draw_vert_lines();
drawing.moveTo(0,0);


let get_coord = (x, y, n=0) => {return {x:+x, y:+y, n:+n}};
let check_sorrounding = (coord) => {
    let x = coord.x;
    let y = coord.y;
    let ret = {count: 0, coords: Array()};
    let push_coord = (coord)=>{
        if(coord.x> -1 && coord.x < squares_x && coord.y> -1 && coord.y < squares_y){
            ret.coords.push(coord)
        }
    };
    let add = () =>{ret.count++};
    let chk = (x, y) =>{
        let result = false;
        try{
            result = game_board[x][y];
        }catch (err){
            return false
        }
        return result
    };

    for (let i = -1; i < 2; i++){
        for (let j = -1; j < 2; j++){
            if(!(i === 0 && j === 0)){
                if(chk(x+i,y+j) === true){add()}else{push_coord(get_coord(x+i, y+j))}
            }
        }
    }
    return ret
};

function reveal_square(x, y) {
    let queue = new Queue();
    queue.enqueue(get_coord(x ,y));

    let check_coord = (coord) =>{
        if(!checked_squares[coord.x][coord.y]) {
            let coord_result = check_sorrounding(coord);
            //console.log(coord.x.toString() + " " + coord.y.toString() + " " + coord_result.count.toString());
            //console.log(queue.getLength());
            if (coord_result.count === 0) {
                coord_result.coords.forEach((e) => {
                    if(checked_squares[e.x][e.y] === false){
                        //console.log("enqueued coord");
                        queue.enqueue(e)
                    }
                });
                draw.draw_empty(coord.x, coord.y)
            } else {
                draw.draw_number(coord.x, coord.y, coord_result.count)
            }
            checked_squares[coord.x][coord.y] = true
        }else{
            //console.log("failed check")
        }
    };
    while (!queue.isEmpty()){
        check_coord(queue.dequeue())
    }
}

canvas.addEventListener('click', (event) => {
    if(!game_ended){
        let x = Math.floor(event.pageX / square_size)-1;
        let y = Math.floor(event.pageY / square_size)-1;
        //console.log(x.toString() + " " + y.toString()+ " " + game_board[x][y].toString());
        if(game_board[x][y]){
            draw.draw_game_lost();
            game_ended = true
        }else{
            reveal_square(x, y);
            let game_won = true;
            for(let i in _.range(checked_squares.length)){
                for (let j in _.range(checked_squares[i].length)){
                    if (!checked_squares[i][j]){
                        if (!game_board[i][j]){
                            game_won = false
                        }
                    }
                }
            }
            if(game_won){
                draw.draw_game_won();
                game_ended = true
            }
        }

    }
}, false);

