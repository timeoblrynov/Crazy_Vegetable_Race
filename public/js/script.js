var block = document.getElementById("block");
var space = document.getElementById("space");
var items = document.getElementById("items");
var jumping = 0;
var counter = 0;

space.addEventListener('animationiteration', () => {
    var random = -((Math.random()*300)+ 150)
    space.style.top = random + "px";
});

setInterval(function() {
    var itemsTop = parseInt(window.getComputedStyle(items).getPropertyValue("top"));
    if(jumping == 0){
        items.style.top = (itemsTop + 3) + "px";
    }

    var blockLeft = parseInt(window.getComputedStyle(block).getPropertyValue("left"));
    var spaceTop = parseInt(window.getComputedStyle(space).getPropertyValue("top"));
    var itemsTop = parseInt(window.getComputedStyle(items).getPropertyValue("top"));
    var cTop = itemsTop - 850 + Math.abs(spaceTop) - 50;


    if((itemsTop > 880) || ((blockLeft < 20) && (blockLeft > -50) && ((cTop < 0) || (cTop > 150)))) {
        alert("Game over" + counter);
        items.style.top = 100 + "px";
        counter = 0;
        
    }
},10);

function randomRotation() {
    return Math.floor(Math.random()*166) - 66;
}

function jump() {
    jumping = 1;
    let jumpingCount = 0;
    var jumpInterval = setInterval(function() {
        var itemsTop = parseInt(window.getComputedStyle(items).getPropertyValue("top"));
        if((itemsTop > 6)&&(jumpingCount < 15)) {
            items.style.top = (itemsTop - 5) + "px";
            items.style.rotate = Math.floor(Math.random()*166) - 66;
        }
        
        if(jumpingCount > 20) {
            clearInterval(jumpInterval);
            jumping = 0;
            jumpingCount = 0;
        }
        jumpingCount ++;
    },10)
}