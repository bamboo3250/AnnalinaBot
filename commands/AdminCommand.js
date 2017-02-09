module.exports = {
    handle: function(message, bot) {
        if (!bot.isAdmin(message)) return;

        var command = bot.functionHelper.parseCommand(message);

        if (command.commandName === "~totalbread") {
            message.reply("\nTotal bread received: " + bot.total_bread);
            return;
        }
        if (command.commandName === "~kill") {
            process.exit();
            return;
        }
        if (command.commandName === "~resettrainer") {
            if (!bot.battleController) return;
            if (bot.battleController.type != "training") return;
            bot.battleController.resetAllTrainers();
            return;
        }
    }
}