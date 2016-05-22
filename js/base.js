// Add 'show' and 'hide' events
(function ($) {
      $.each(['show', 'hide'], function (i, ev) {
        var el = $.fn[ev];
        $.fn[ev] = function () {
          this.trigger(ev);
          return el.apply(this, arguments);
        };
      });
})(jQuery);

$(function() {
    var i = Number(localStorage.getItem('item-counter')) + 1,
	j = 0,
	k,
	$name = $('#qu-form-name'),
	$role = $('#qu-form-role'),
	$nextpagebutton = $('#next-button'),
	$questiontext = $('#question-text'),
	$freelist = $('#freelist-form'),
	$removeLink = $('#show-freelist-items li a'),
	$itemList = $('#show-freelist-items'),
	$editable = $('.editable'),
	$clearAll = $('#clear-all'),
	$newItem = $('#freelist-item'),
	order = [],
	orderList;

    $('.page').hide();
    $('#page-1').show();

    var dataUploaded = false;

    // Send JSON functionality
    sendJSON = function(d) {
	console.log(d);
	$.post("http://logs-01.loggly.com/inputs/8b49d6fa-af6c-441a-9842-daa7316bddd3/tag/http/",
	       JSON.stringify(d),
	       function() { console.log("Data uploaded");
			    $('.uploader').trigger('/dataUploaded/');
			  });
	
    }

    sendConfirm = function() {
	var rv = confirm("These data will be stored for analysis.  Continue?");
	return rv;
    }

    packRisks = function(orderList) {
	var $todoItemLi = $('#rank-freelist-items li')
	var d = {};
	$todoItemLi.each(function(index) {
	    d[index] = $( this ).text().split(" ")[0];
	});
	return d;
    }

    sendFormData = function() {
	var d = { 'id' : uuid.v4(),
    		  'name' : $name.val(),
    		  'role' : $role.val(),
    		  'risks' : packRisks(orderList),
    		};
    	sendJSON(d);
    }

    var spinner = new Spinner();
    
    // Page progression
    $('#page1-submit').submit(function(e) {
	e.preventDefault();
	if($.trim($name.val()) == '')
	    alert('Please enter your name');
	else if($.trim($role.val()) == '')
	    alert('Please enter your role');
	else {
	    $('#page-1').hide();
	    $('#page-2').show();
	}
    });
    $('#page2-submit').submit(function(e) {
	e.preventDefault();
	orderList = localStorage.getItem('item-orders');
	if(!orderList) {
	    alert('Please enter a risk');
	}
	else {
	    $('#page-2').hide();
	    $('#page-3').show();
	}
    });
    $('#page3-submit').submit(function(e) {
	e.preventDefault();
	console.log("page-3 submit pressed");
	if(sendConfirm()) {
	    spinner.spin(document.getElementById('page3-spinner'));
	    sendFormData();
	}
    });
    $('#page-3').bind('/dataUploaded/', function(e) {
	spinner.stop();
	$('#page-3').hide();
	$('#page-4').show();
    });
    $('#page4-submit').submit(function(e) {
	$.publish('/clear-all/',[]);
    });

    // Page 3 populate list
    $('#page-3').bind('show', function() {
	orderList = localStorage.getItem('item-orders');
	orderList = orderList ? orderList.split(',') : [];
	$itemList = $('#rank-freelist-items');
	for( j = 0, k = orderList.length; j < k; j++) {
	    $itemList.append(
		"<li class='draggable' id='" + orderList[j] + "'>"
		    + "<span>" 
		    + localStorage.getItem(orderList[j]) 
		    + "</span></li>"
	    );
	}
	$itemList.sortable({
	    disabled: false,
	});
    });

    $('#page-4').bind('show', function() {
	$('#name').text($name.val());
    });
			      
    
    // Add item
    $freelist.submit(function(e) {
	e.preventDefault();
	$.publish('/add/', []);
    });

    // Remove item
    $itemList.delegate('a', 'click', function(e) {
	var $this = $(this);
	e.preventDefault();
	$.publish('/remove/', [$this]);
    });
    
    // Sort todo
    $itemList.sortable({
	revert: true,
	disabled: true,
	stop: function() {
	    $.publish('/regenerate-list/', []);
	}
    });
    
    // Edit and save todo
    $editable.inlineEdit({
	save: function(e, data) {
	    var $this = $(this);
	    localStorage.setItem(
		$this.parent().attr("id"), data.value
	    );
	}
    });

    // Clear all
    $clearAll.click(function(e) {
	e.preventDefault();
	$.publish('/clear-all/', []);
    });

    // Fade In and Fade Out the Remove link on hover
    $itemList.delegate('li', 'mouseover mouseout', function(event) {
	var $this = $(this).find('a');
        
	if(event.type === 'mouseover') {
	    $this.stop(true, true).fadeIn();
	} else {
	    $this.stop(true, true).fadeOut();
	}
    });
    
    // Subscribes
    $.subscribe('/add/', function() {
	if ($newItem.val() !== "") {
	    // Take the value of the input field and save it to localStorage
	    localStorage.setItem( 
		"item-" + i, $newItem.val() 
	    );
            
	    // Set the to-do max counter so on page refresh it keeps going up instead of reset
	    localStorage.setItem('item-counter', i);
            
	    // Append a new list item with the value of the new todo list
	    $itemList.append(
                "<li id='item-" + i + "'>"
                    + "<span class='editable'>"
                    + localStorage.getItem("item-" + i) 
                    + " </span><a href='#'>x</a></li>"
	    );

	    $.publish('/regenerate-list/', []);

	    // Hide the new list, then fade it in for effects
	    $("#item-" + i)
		.css('display', 'none')
		.fadeIn();
            
	    // Empty the input field
	    $newItem.val("");
            
	    i++;
	}
    });
    
    $.subscribe('/remove/', function($this) {
	var parentId = $this.parent().attr('id');
        
	// Remove todo list from localStorage based on the id of the clicked parent element
	localStorage.removeItem(
            "'" + parentId + "'"
	);
        
	// Fade out the list item then remove from DOM
	$this.parent().fadeOut(function() { 
	    $this.parent().remove();
            
	    $.publish('/regenerate-list/', []);
	});
    });
    
    $.subscribe('/regenerate-list/', function() {
	var $todoItemLi = $('#show-freelist-items li');
	// Empty the order array
	order.length = 0;
        
	// Go through the list item, grab the ID then push into the array
	$todoItemLi.each(function() {
	    var id = $(this).attr('id');
	    order.push(id);
	});
        
	// Convert the array into string and save to localStorage
	localStorage.setItem(
	    'item-orders', order.join(',')
	);
    });
    
    $.subscribe('/clear-all/', function() {
	var $todoListLi = $('#show-freelist-items li');
        
	order.length = 0;
	localStorage.clear();
	$todoListLi.remove();
    });


    // Clear storage to begin
    $.publish('/clear-all/',[]);
});

