App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,
  
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
    
    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + App.account);
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
        document.getElementById("voterChoice").style="margin-left: 550px; font-size: 20px;";
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

    document.getElementById("mainBody").innerHTML = "<table class=\"table\"><thead><tr><th scope=\"col\">#</th><th scope=\"col\">Name</th><th scope=\"col\">Votes</th></tr></thead><tbody id=\"candidatesResults\"></tbody></table>";

  },

  getAddressBook: function() {
    var adminAddress = "0x04d6cE158c414402AAC8135563FB3FCa3688822D";
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
    var adminAddress = "0x04d6cE158c414402AAC8135563FB3FCa3688822D";
    var address = App.account;
    if(address == adminAddress.toLowerCase()){
      $("#add-candidate").show();
    }
    else{
      alert('You are not authorized as admin')
    }
  },

  stringToHash: function(string) { 
                  
    var hash = 0; 
      
    if (string.length == 0) return hash; 
      
    for (i = 0; i < string.length; i++) { 
        char = string.charCodeAt(i); 
        hash = ((hash << 5) - hash) + char; 
        hash = hash & hash; 
    } 
      
    return hash; 
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