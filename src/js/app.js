App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,
  adminAddress: "0x04d6cE158c414402AAC8135563FB3FCa3688822D",
  questionaryCounters:[0,0,0,0,0,0,0,0,0,0,0],
  myQuestions:[
    {
      question: "Who did you choose?",
      answers: {
        a: "Bibi",
        b: "Gantz",
        c: "Bennet",
        d: "Other"
      },
    },
    {
      question: "Are you a right wing or left wing?",
      answers: {
        a: "Right",
        b: "Left",
        c: "Not sure about that"
      },
    },
    {
      question: "How do you feel about voting with DAPP election system?",
      answers: {
        a: "Great",
        b: "Good",
        c: "Bad",
        d: "Not sure about that"
      },
    }
  ],
  
  init: function() {
    return App.initWeb3();
    
  },
  
  initWeb3: function() {
    // TODO: refactor conditional
    
    
    
    window.ethereum.enable();
    // web3.eth.defaultAccount = App.account;
    
    
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },
  
  initContract: function() {
    $.getJSON("Election.json", function(election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });

    $.getJSON("ElectionToken.json", function(erc20) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.ERC20 = TruffleContract(erc20);
      // Connect provider to interact with contract
      App.contracts.ERC20.setProvider(App.web3Provider);

      App.listenForERC20Events();

      // return App.render();
    });
  },

  listenForERC20Events: function() {
    App.contracts.ERC20.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.Transfer({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)

      });

      instance.Approval({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)

      });
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.Election.deployed().then(function(instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },

  render: function() {
    var electionInstance;
    var loader = $("#loader");
    var content = $("#content");
    $("#addressesBook").hide();
    $("#container_form").hide();
    $("#submit").hide();
    
    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + App.account);
      }
    });


    App.contracts.Election.deployed().then(function(instance) {
      for (var i = 0; i <= 10 ; i++) {
        instance.questionaryCounters(i).then(count =>{
          App.questionaryCounters[i] = count;
       })
      }
    });

    // Load contract data
    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function(candidatesCount) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      for (var i = 1; i <= candidatesCount; i++) {
        electionInstance.candidates(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];

          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          candidatesResults.append(candidateTemplate);

          // Render candidate ballot option
          var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
          candidatesSelect.append(candidateOption);
        });
      }

      return electionInstance.voters(App.account);
    }).then(function(hasVoted) {
      // Do not allow a user to vote
      if(hasVoted) {
        $('form').hide();
        document.getElementById("voterChoice").style="font-size: 20px;";
        document.getElementById("voterChoice").innerHTML = "<p> You already voted!!!</p>";
      }
      loader.hide();
      content.show();
      $("#add-candidate").hide();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      hasVoted = true;
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();

      
      var bankAddress = 0x04d6cE158c414402AAC8135563FB3FCa3688822D;
      App.contracts.ERC20.deployed().then(function(erc20Instance){
        return erc20Instance.transfer(App.account,21000);
      }).then(function (res){
        console.log(res);
      }).catch(function(err) {
        console.error(err);
      });
      // App.contracts.Election.deployed().then(function(instance) {
      //   return instance.pay(100, { from: App.account });
      // }).then(function(result) {
      //   console.log(result);
      // })
    }).catch(function(err) {
      console.error(err);
    });
  },

  showResults: function() {

    App.contracts.Election.deployed().then(function(instance) {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function(candidatesCount) {
      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      for (var i = 1; i <= candidatesCount; i++) {
        electionInstance.candidates(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];

          // Render candidate Result
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
          candidatesResults.append(candidateTemplate);

        });
      }
      return electionInstance.voters(App.account);
    }).then(function(hasVoted) {
      // Do not allow a user to vote
      if(hasVoted) {
        $('form').hide();
        // document.getElementById("voterChoice").innerHTML = "<p> You already voted!!!</p>";
      }
      $("#content").show();
      $("#loader").hide();
    }).catch(function(error) {
      console.warn(error);
    });

    document.getElementById("mainBody").innerHTML = "<h1>Final results:</h1><br/><table class=\"table\"><thead><tr><th scope=\"col\">#</th><th scope=\"col\">Name</th><th scope=\"col\">Votes</th></tr></thead><tbody id=\"candidatesResults\"></tbody></table>";

  },

  getAddressBook: function() {
    var adminAddress = App.adminAddress;
    var address = App.account;
    if(address == adminAddress.toLowerCase()){
    App.contracts.Election.deployed().then(function(instance) {
      var addresses = [];
      var count = 1;
      var addressesBook = $("#addressesBook");
      addressesBook.empty();

        for (var i = 0; i <= 10 ; i++) {
          instance.addressLUT(i).then(voter =>{
          addresses.push(voter);
          var id = count;
          count++;
          var address = voter;
          var addressesBookTemplate = "<tr><th>" + id + "</th><td>" + address + "</td></tr>"
          addressesBook.append(addressesBookTemplate);
         })
        }
        // document.getElementById("addressesBook").style = "margin-left: 550px; padding: 10px;";
        document.getElementById("addressesBook").innerHTML = "<table class=\"table\"><thead><tr><th scope=\"col\">#</th><th scope=\"col\">Address</th></tr></thead><tbody id=\"addressesBook\"></tbody></table>";

        $("#addressesBook").show();

      // return instance.getAddressBook().then(res =>{
      //   if(res){
      //     var voters = res;
      //   }
      // });
    });
  }
  else{
    alert('You are not authorized as admin')
  }
  },

  loginAsAdmin: function(){
    var adminAddress = App.adminAddress;
    var address = App.account;
    if(address == adminAddress.toLowerCase()){
      $("#add-candidate").show();
    }
    else{
      alert('You are not authorized as admin')
    }
  },

  showQuestionary: function(){
    $("#container_form").show();
  },

  buildQuiz: function(quizContainer){
      // variable to store the HTML output
      const output = [];
    
      // for each question...
      App.myQuestions.forEach(
        (currentQuestion, questionNumber) => {
    
          // variable to store the list of possible answers
          const answers = [];
    
          // and for each available answer...
          for(letter in currentQuestion.answers){
    
            // ...add an HTML radio button
            answers.push(
              `<label>
                <input type="radio" name="question${questionNumber}" value="${letter}">
                ${letter} :
                ${currentQuestion.answers[letter]}
              </label>`
            );
          }
    
          // add this question and its answers to the output
          output.push(
            `<div class="question"><b><u> ${currentQuestion.question} </u></b></div>
            <div class="answers"> ${answers.join('')} </div>`
          );
        }
      );
    
      // finally combine our output list into one string of HTML and put it on the page
      quizContainer.innerHTML = output.join('');

  },

  showQuiz: function(){

    const quizContainer = document.getElementById('quiz');
    const resultsContainer = document.getElementById('results');
    const submitButton = document.getElementById('submit');
    App.buildQuiz(quizContainer);
    // App.showQuizResults(quizContainer, resultsContainer)


    // Event listeners
    // submitButton.addEventListener('click', showResults);

    $("#submit").show();
  },

  showQuizResults: function(){

    const quizContainer = document.getElementById('quiz');
    const resultsContainer = document.getElementById('results');
    // gather answer containers from our quiz
    const answerContainers = quizContainer.querySelectorAll('.answers');

    // keep track of user's answers
    let numCorrect = 0;

    // for each question...
    App.myQuestions.forEach( (currentQuestion, questionNumber) => {

    // find selected answer
    const answerContainer = answerContainers[questionNumber];
    const selector = `input[name=question${questionNumber}]:checked`;
    const userAnswer = (answerContainer.querySelector(selector) || {}).value;
    
    if (currentQuestion.question == "Who did you choose?") {
      switch (userAnswer) {
        case 'a':
          App.questionaryCounters[0]++;
          break;
        case 'b':
          App.questionaryCounters[1]++;
          break;
        case 'c':
          App.questionaryCounters[2]++;
          break;
        case 'd':
          App.questionaryCounters[3]++;
          break;
      
        default:
          break;
      }  
    }

    if (currentQuestion.question == "Are you a right wing or left wing?") {
      switch (userAnswer) {
        case 'a':
          App.questionaryCounters[4]++;
          break;
        case 'b':
          App.questionaryCounters[5]++;
          break;
        case 'c':
          App.questionaryCounters[6]++;
          break;
      
        default:
          break;
      }  
    }

    if (currentQuestion.question == "How do you feel about voting with DAPP election system?") {
      switch (userAnswer) {
        case 'a':
          App.questionaryCounters[7]++;
          break;
        case 'b':
          App.questionaryCounters[8]++;
          break;
        case 'c':
          App.questionaryCounters[9]++;
          break;
        case 'd':
          App.questionaryCounters[10]++;
          break;
      
        default:
          break;
      }  
    }
    

  });

  App.contracts.Election.deployed().then(function(instance) {
    instance.storeCounts(App.questionaryCounters);
  });
  


  JSC.Chart('firstGraph', {
    type: 'horizontal column',
    series: [
       {
          name:'Who did you choose?',
          points: [
             {x: 'Bibi', y: App.questionaryCounters[0]},
             {x: 'Gantz', y: App.questionaryCounters[1]},
             {x: 'Bennet', y: App.questionaryCounters[2]},
             {x: 'Other', y: App.questionaryCounters[3]},
          ]
       }
    ]
 });

 JSC.Chart('secondGraph', {
  type: 'horizontal column',
  series: [
    {
       name:'Are you a right wing or left wing?',
       points: [
          {x: 'Right', y: App.questionaryCounters[4]},
          {x: 'Left', y: App.questionaryCounters[5]},
          {x: 'Not sure about that', y: App.questionaryCounters[6]},
       ]
    }
 ]
});

JSC.Chart('thirdGraph', {
  type: 'horizontal column',
  series: [
    {
       name:'How do you feel about voting with DAPP election system?',
       points: [
          {x: 'Great', y: App.questionaryCounters[7]},
          {x: 'Good', y: App.questionaryCounters[8]},
          {x: 'Bad', y: App.questionaryCounters[9]},
          {x: 'Not sure about that', y: App.questionaryCounters[10]},
       ]
    }
 ]
});

  // show number of correct answers out of total
  // resultsContainer.innerHTML = `${numCorrect} out of ${myQuestions.length}`;
  },

  addCandidate: function(candidate_name) {
    App.contracts.Election.deployed().then(function(instance) {
      return instance.addCandidate(candidate_name.value);
    }).then(function(isAdded){
      if(isAdded){
        // App.render();
      }
    }).catch(function(err) {
      console.error(err);
    });
  },
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});