var Monopoly = {};
Monopoly.allowRoll = true;
Monopoly.moneyAtStart = 400;
Monopoly.doubleCounter = 0;
var w = 1;

Monopoly.init = function () { //game initialization
    $(document).ready(function () {
        Monopoly.adjustBoardSize();
        $(window).bind("resize", Monopoly.adjustBoardSize);
        Monopoly.initDice();
        Monopoly.initPopups();
        Monopoly.start();
    });
};

Monopoly.start = function () {
    Monopoly.showPopup("intro")
};


Monopoly.initDice = function () {
    $(".dice").click(function () {
        if (Monopoly.allowRoll) {
            Monopoly.rollDice();
        }
    });
};


Monopoly.getCurrentPlayer = function () {
    return $(".player.current-turn"); //use this function in the console log to do actions on the current player. Ex : Monopoly.updatePlayersMoney(Monopoly.getCurrentPlayer(), ammount)
};

Monopoly.isPlayerHome = function (player) { //checks if the current player is located on a property that belongs to him
    var playerId = player.attr("id");
    if (player.closest(".cell").attr('data-owner') == playerId) {
        player.addClass("isHome"); //add a smiley face
        return true;
    } else if (player.closest(".cell").attr('data-owner') !== playerId) {
        player.removeClass("isHome");
    } else {
        return false;
    }
}

Monopoly.getPlayersCell = function (player) { //return the id of the <cell> where the current player is. Ex : "cell134"
    Monopoly.isPlayerHome(player);
    return player.closest(".cell");
};


Monopoly.getPlayersMoney = function (player) {
    return parseInt(player.attr("data-money"));
};

Monopoly.updatePlayersMoney = function (player, amount) { //use this function when a financial transaction is mde (ex: buy, pay rent)
    var playerId = player.attr("id"); //gets the player name for the innerText in the sideBar
    var playersMoney = parseInt(player.attr("data-money"));
    playersMoney -= amount;
    player.attr("data-money", playersMoney);
    player.attr("title", player.attr("id") + ": $" + playersMoney);
    Monopoly.playSound("chaching");
    $("#container" + playerId).text(playerId + " : " + player.attr("data-money") + "$"); //visual update
};

//check if the data-money attribute of the current player is inferior strict to 0. If it is, we remove him from the game and his propertis are available again
Monopoly.checkIfBroke = function (player) {
    var playersMoney = parseInt(player.attr("data-money"));
    if (playersMoney < 0) {
        var playerId = player.attr("id");
        $("#container" + playerId).css("display", "none"); //visual update
        player.addClass("removed"); //display:none + skip his turn when invoking MonopolysetNextPlayerTurn();   
        var properties = $("." + playerId);
        if (properties.length > 0) {
            for (var i = 0; i < properties.length; i++) { //all the properties are available again.
                properties[i].classList.add('available');
                properties[i].classList.remove(player.attr("id"));
                properties[i].classList.remove(playerId);
                properties[i].setAttribute("data-owner", "");
                properties[i].setAttribute("data-rent", "");
            }

        }
        var popup = Monopoly.getPopup("broke"); //display a popup instead of an alert.
        popup.find("button").unbind("click").bind("click", Monopoly.closePopup);
        Monopoly.showPopup("broke");


    }
}


Monopoly.rollDice = function () {
    var currentPlayer = Monopoly.getCurrentPlayer();
    var result1 = Math.floor((Math.random() * 6) + 1); //Randomizes the two integers that will appear on the dices
    var result2 = Math.floor((Math.random() * 6) + 1);
    $(".dice").find(".dice-dot").css("opacity", 0);
    $(".dice#dice1").attr("data-num", result1).find(".dice-dot.num" + result1).css("opacity", 1); //display the black dots that are needed according to the 2 random numbers
    $(".dice#dice2").attr("data-num", result2).find(".dice-dot.num" + result2).css("opacity", 1);
    if (result1 == result2) { //if double
        Monopoly.doubleCounter++;
        if (Monopoly.doubleCounter == 3) {
            Monopoly.sendToJail(currentPlayer);
            Monopoly.isPlayerHome(currentPlayer);
            Monopoly.doubleCounter = 0;
            Monopoly.setNextPlayerTurn();
        }
    }
    else {
        Monopoly.doubleCounter = 0;
    }
    var currentPlayer = Monopoly.getCurrentPlayer();
    Monopoly.handleAction(currentPlayer, "move", result1 + result2);
};

//Every 0.2 sec, the current player div will stop being display on the current cell, as it will be display on the next cell.
Monopoly.movePlayer = function (player, steps) {
    Monopoly.allowRoll = false;
    var playerMovementInterval = setInterval(function () {
        if (steps == 0) {
            clearInterval(playerMovementInterval);
            Monopoly.handleTurn(player);
        } else {
            var playerCell = Monopoly.getPlayersCell(player);
            var nextCell = Monopoly.getNextCell(playerCell);
            nextCell.find(".content").append(player);
            steps--;
        }
    }, 200);
};

Monopoly.buyHouses = function (player) { // if the player's closest cell belongs to him, then display a popu that allow him to build houses.
    var popup = Monopoly.getPopup("buyHouses"); //display a popup instead of an alert.
    popup.find("#buildHouses").unbind("click").bind("click", Monopoly.buildHouses);
    popup.find(".refuse").unbind("click").bind("click", function () {
        Monopoly.closePopup();
        Monopoly.setNextPlayerTurn(Monopoly.getCurrentPlayer());
    });
    Monopoly.showPopup("buyHouses");

}

Monopoly.buildHouses = function () { //if the player can afford it, we create as much divs as the number of houses.
    var playersMoneyHouse = Monopoly.getPlayersMoney(Monopoly.getCurrentPlayer());
    var propertyCellHouse = Monopoly.getPlayersCell(Monopoly.getCurrentPlayer());
    var builderPlayer = Monopoly.getCurrentPlayer();
    var numOfHouses = $("#num-of-houses").val();
    var cellGroupHouse = propertyCellHouse.attr("data-group");
    var cellPriceHouse = parseInt(cellGroupHouse.replace("group", "")) * 5;
    var houseCost = parseInt(cellPriceHouse * 4);
    if (numOfHouses == 0) {
        Monopoly.closePopup();
        Monopoly.setNextPlayerTurn(Monopoly.getCurrentPlayer());
    }
    else if (playersMoneyHouse >= houseCost) {
        Monopoly.updatePlayersMoney(Monopoly.getCurrentPlayer(), houseCost)
        var existingHouses = parseInt(propertyCellHouse.attr("data-hostel"))
        var newDataHostel = existingHouses + numOfHouses;
        propertyCellHouse.attr("data-hostel", newDataHostel); //update the data-hostel attribute to the new number of houses.
        if (propertyCellHouse.attr("data-hostel") == 5) {
            $('.numOfHouses').css('display', 'none');
            var divHostel = document.createElement('div');
            $(builderPlayer.closest(".cell")).append(divHostel);
            divHostel.classList.add(('hostel'));
            //1 hostel = 5 houses.
        } else {
            for (var i = 1; i <= numOfHouses; i++) {
                var divHouse = document.createElement('div')
                $(builderPlayer.closest(".cell")).append(divHouse);
                divHouse.classList.add(('numOfHouses'))
            }
        }
        Monopoly.closePopup();
        Monopoly.setNextPlayerTurn(Monopoly.getCurrentPlayer());
    } else {
        $("#price-of-houses").text("not enough cash");
        Monopoly.buyHouses()
    }
    ;
}


Monopoly.housesInput = function () {  //Calculate & validate the cost of the investment, according to the initial price of the property and to the number of houses.
    var propertyCellHouse = Monopoly.getPlayersCell(Monopoly.getCurrentPlayer());
    var cellGroupHouse = propertyCellHouse.attr("data-group");
    var cellPriceHouse = parseInt(cellGroupHouse.replace("group", "")) * 5;
    var houseCost = parseInt(cellPriceHouse * 4);
    var numOfHouses = $("#num-of-houses").val();
    houseCost = houseCost * numOfHouses;
    $("#price-of-houses").text("Price: " + houseCost + "$")
}


Monopoly.handleTurn = function () {
    var player = Monopoly.getCurrentPlayer();
    var playerCell = Monopoly.getPlayersCell(player);
    if (Monopoly.isPlayerHome(player) && playerCell.attr("data-group") !== "rail" && Monopoly.getPlayersCell(Monopoly.getCurrentPlayer()).attr('data-hostel') !== 5) {
        Monopoly.buyHouses();
    }
    else if (playerCell.is(".available.property")) {
        Monopoly.handleBuyProperty(player, playerCell);
    } else if (playerCell.is(".property:not(.available)") && !playerCell.hasClass(player.attr("id"))) {
        Monopoly.handlePayRent(player, playerCell);
    } else if (playerCell.is(".go-to-jail")) {
        Monopoly.handleGoToJail(player);
    } else if (playerCell.is(".chance")) {
        Monopoly.handleChanceCard(player);
    } else if (playerCell.is(".community")) {
        Monopoly.handleCommunityCard(player);
    } else {
        Monopoly.setNextPlayerTurn();
    }
}

Monopoly.setNextPlayerTurn = function () { //remove the attribute of the current player. Then set the attributte of currentPlayer to the next player.
    var currentPlayerTurn = Monopoly.getCurrentPlayer();
    var playerId = parseInt(currentPlayerTurn.attr("id").replace("player", ""));
    var nextPlayerId = playerId + 1;
    /* here we want to complete the possibility of the player to have a double dice and allow him to play again*/
    if (Monopoly.doubleCounter > 0 && !(currentPlayerTurn.is(".jailed") && !(currentPlayerTurn.is(".removed")))) { // here we added the case when the player has the class removed 
        nextPlayerId = playerId;
    }
    if (nextPlayerId > $(".player").length) {
        nextPlayerId = 1;
    }
    currentPlayerTurn.removeClass("current-turn");
    var nextPlayer = $(".player#player" + nextPlayerId);
    nextPlayer.addClass("current-turn");
    if (nextPlayer.is(".jailed")) {
        var currentJailTime = parseInt(nextPlayer.attr("data-jail-time"));
        currentJailTime++;
        nextPlayer.attr("data-jail-time", currentJailTime);
        if (currentJailTime > 3) {
            nextPlayer.removeClass("jailed");
            nextPlayer.removeAttr("data-jail-time");
        }
        Monopoly.setNextPlayerTurn();
        return;
    }
    if (nextPlayer.is(".removed")) { //f the player is .removed (i.e he is broke), then we invoke this function immediately again, which will skip hsi turn
        Monopoly.setNextPlayerTurn();
        return;
    }
    Monopoly.closePopup();
    Monopoly.allowRoll = true;
};



Monopoly.handleBuyProperty = function (player, propertyCell) {
    var propertyCost = Monopoly.calculateProperyCost(propertyCell);
    var popup = Monopoly.getPopup("buy");
    popup.find(".cell-price").text(propertyCost);
    popup.find("button").unbind("click").bind("click", function () {
        var clickedBtn = $(this);
        if (clickedBtn.is("#yes")) {
            Monopoly.handleBuy(player, propertyCell, propertyCost);
            Monopoly.isPlayerHome(player);
        } else {
            Monopoly.closeAndNextTurn();
        }
    });
    Monopoly.showPopup("buy");
};

Monopoly.handlePayRent = function (player, propertyCell) {
    var popup = Monopoly.getPopup("pay");
    var currentRent = parseInt(propertyCell.attr("data-rent"));
    //change the calculation if there are hostels on the current cell. The rent increases a 20% per house
    var numOfHouses2 = parseInt(propertyCell.attr("data-hostel"));
    if (numOfHouses2 > 0) {
        currentRent = currentRent * 1.2 * numOfHouses2;
    }
    var properyOwnerId = propertyCell.attr("data-owner");
    popup.find("#player-placeholder").text(properyOwnerId);
    popup.find("#amount-placeholder").text(currentRent);
    popup.find("button").unbind("click").bind("click", function () {
        var properyOwner = $(".player#" + properyOwnerId);
        Monopoly.closeAndNextTurn();
        Monopoly.updatePlayersMoney(player, currentRent);
        Monopoly.updatePlayersMoney(properyOwner, -1 * currentRent);
        Monopoly.checkIfBroke(player);
        var playerId = player.attr("id");
        $("#container" + playerId).text(playerId + " : " + player.attr("data-money") + "$");
        $("#container" + properyOwnerId).text(properyOwnerId + " : " + properyOwnerId.attr("data-money") + "$");
    });
    Monopoly.showPopup("pay");
};


Monopoly.handleGoToJail = function (player) {
    var popup = Monopoly.getPopup("jail");
    popup.find("button").unbind("click").bind("click", function () {
        Monopoly.handleAction(player, "jail");
    });
    Monopoly.showPopup("jail");
};


Monopoly.handleChanceCard = function (player) { //Gets an array of question which is in an external server, and randomly pick one of this question
    var popup = Monopoly.getPopup("chance");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_chance_card", function (chanceJson) {
        popup.find(".popup-content #text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action", chanceJson["action"]).attr("data-amount", chanceJson["amount"]);
    }, "json");
    popup.find("button").unbind("click").bind("click", function () {
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        Monopoly.handleAction(player, action, amount);
    });
    Monopoly.showPopup("chance");
};



Monopoly.handleCommunityCard = function (player) { //same
    var popup = Monopoly.getPopup("community");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com//get_random_community_card", function (communityJson) {
        popup.find(".popup-content #text-placeholder").text(communityJson["content"]);
        popup.find(".popup-title").text(communityJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action", communityJson["action"]).attr("data-amount", communityJson["amount"]);
    }, "json");
    popup.find("button").unbind("click").bind("click", function () {
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        Monopoly.handleAction(player, action, amount);
    });
    Monopoly.showPopup("community");
};


Monopoly.sendToJail = function (player) { //removes the currentplayer from its current cell and move it to the the jail cell.
    player.addClass("jailed");
    player.attr("data-jail-time", 1);
    $(".corner.game.cell.in-jail").append(player);
    Monopoly.playSound("woopwoop");
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};


Monopoly.getPopup = function (popupId) {
    return $(".popup-lightbox .popup-page#" + popupId);
};

//calculate the cost according to the cellGroup attribute. Its value is a coefficient in the expression. The higher it is, the more expensive.
Monopoly.calculateProperyCost = function (propertyCell) {
    var cellGroup = propertyCell.attr("data-group");
    var cellPrice = parseInt(cellGroup.replace("group", "")) * 5;
    if (cellGroup == "rail") {
        cellPrice = 10;
    }
    return cellPrice;
};

//same
Monopoly.calculateProperyRent = function (propertyCost) {
    return propertyCost / 2;
};


Monopoly.closeAndNextTurn = function () {
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};

Monopoly.initPopups = function () {
    $(".popup-page#intro").find("button").click(function () {
        var numOfPlayers = $(this).closest(".popup-page").find("input").val();
        if (Monopoly.isValidInput("numofplayers", numOfPlayers)) {
            Monopoly.createPlayers(numOfPlayers);
            Monopoly.closePopup();
        }
    });
};

//whenever the currentPlayer buy a cell that has the class .available
Monopoly.handleBuy = function (player, propertyCell, propertyCost) {
    var playersMoney = Monopoly.getPlayersMoney(player)
    if (playersMoney < propertyCost) {
        var noMoney = new Audio('./sounds/noMoneySound.mp3');
        noMoney.play();
        Monopoly.showErrorMsg();
    } else {
        Monopoly.updatePlayersMoney(player, propertyCost);
        var rent = Monopoly.calculateProperyRent(propertyCost);

        propertyCell.removeClass("available")
            .addClass(player.attr("id"))
            .attr("data-owner", player.attr("id"))
            .attr("data-hostel", 0) //add the data-hostel aattribute to be able to build houses on properties
            .attr("data-rent", rent);
        var playerId = player.attr("id");
        $("#container" + playerId).text(playerId + " : " + player.attr("data-money") + "$");
        Monopoly.setNextPlayerTurn();
    }
};

//invoked for 3 contexts : when the player moves, pays or is sent to jail.
Monopoly.handleAction = function (player, action, amount) {
    switch (action) {
        case "move":
            Monopoly.movePlayer(player, amount);
            break;
        case "pay":
            Monopoly.updatePlayersMoney(player, amount);
            Monopoly.checkIfBroke(player);
            var playerId = player.attr("id");
            $("#container" + playerId).text(playerId + " : " + player.attr("data-money") + "$");
            Monopoly.setNextPlayerTurn();
            break;
        case "jail":
            Monopoly.sendToJail(player);
            break;
    };
    Monopoly.closePopup();
};

//Geekout: create 6 player (+ change the conditions in the isValidInput function )
Monopoly.createPlayers = function (numOfPlayers) {
    var startCell = $(".go");
    for (var i = 1; i <= numOfPlayers; i++) {
        var player = $("<div />").addClass("player shadowed").attr("id", "player" + i).attr("title", "player" + i + ": $" + Monopoly.moneyAtStart);
        startCell.find(".content").append(player);
        if (i == 1) {
            player.addClass("current-turn"); //currentPlayer will be the div with the id #player1
        }
        player.attr("data-money", Monopoly.moneyAtStart);
        $("#containerplayer" + i).css("display", "block");
        $("#containerplayer" + i).text("player" + i + " : " + player.attr("data-money") + "$");
    }
};


Monopoly.getNextCell = function (cell) {
    var currentCellId = parseInt(cell.attr("id").replace("cell", ""));
    var nextCellId = currentCellId + 1
    if (nextCellId > 40) { //if the currentPlayer passes the Go Case (i.e he did a complete turn), then invoke this function
        Monopoly.handlePassedGo();
        nextCellId = 1;
    }
    return $(".cell#cell" + nextCellId);
};


Monopoly.handlePassedGo = function () {
    var player = Monopoly.getCurrentPlayer();
    Monopoly.updatePlayersMoney(player, (-1) * Monopoly.moneyAtStart / 10); //Add money to the currentPlayer
    var playerId = player.attr("id");
    $("#container" + playerId).text(playerId + " : " + player.attr("data-money") + "$");
};


Monopoly.isValidInput = function (validate, value) { //check if the input entered by the user is between a defined interval (here its 0<value<5)
    var isValid = false;
    switch (validate) {
        case "numofplayers":
            if (value > 1 && value <= 6) {
                isValid = true;
            } else {
                isValid = false;
            }
    }

    if (!isValid) {
        Monopoly.showErrorMsg();
    }
    return isValid;

}

Monopoly.showErrorMsg = function () { //whenever the user does sth that compromises the conditions.
    $(".popup-page .invalid-error").fadeTo(500, 1);
    setTimeout(function () {
        $(".popup-page .invalid-error").fadeTo(500, 0);
    }, 2000);
};


Monopoly.adjustBoardSize = function () {
    var gameBoard = $(".board");
    var boardSize = Math.min($(window).height(), $(window).width());
    boardSize -= parseInt(gameBoard.css("margin-top")) * 2;
    $(".board").css({
        "height": boardSize,
        "width": boardSize
    });
}

Monopoly.closePopup = function () {
    $(".popup-lightbox").fadeOut();
};

Monopoly.playSound = function (sound) {
    var snd = new Audio("./sounds/" + sound + ".wav");
    snd.play();
}

Monopoly.showPopup = function (popupId) {
    $(".popup-lightbox .popup-page").hide();
    $(".popup-lightbox .popup-page#" + popupId).show();
    $(".popup-lightbox").fadeIn();
};

Monopoly.init();
