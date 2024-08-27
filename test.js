const validatePasswordSignup = (text) => {
    if (text.length < 8){
        console.log("error");
        return;
    }
    if(text.search(/[a-z]/) === -1){
        console.log("error");
        return;
    }
    if(text.search(/[A-Z]/) === -1){
        console.log("error");
        return;
    }
    if(text.search(/[0-9]/i) === -1){
        console.log("error");
        return;
    }
    console.log("success");
};

validatePasswordSignup("asad");
