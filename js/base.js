$(function() {
    var i = Number(localStorage.getItem('todo-counter')) + 1,
	j = 0,
	k,
	$nextpagebutton = $('#next-button'),
	$questiontext = $('#question-text'),
	$form = $('#todo-form'),
	$nextpage = $('#form-submitter'),
	$removeLink = $('#show-items li a'),
	$itemList = $('#show-items'),
	$editable = $('.editable'),
	$clearAll = $('#clear-all'),
	$newTodo = $('#todo'),
	order = [],
	orderList;

    // Set submit form properties
    $nextpage.data('page','freelist');

    // Load todo list
    orderList = localStorage.getItem('todo-orders');
    
    orderList = orderList ? orderList.split(',') : [];
    
    for( j = 0, k = orderList.length; j < k; j++) {
	$itemList.append(
            "<li id='" + orderList[j] + "'>"
		+ "<span class='editable'>" 
		+ localStorage.getItem(orderList[j]) 
		+ "</span> <a href='#'>X</a></li>"
	);
    }

    // Risks --> ranking
    $nextpage.submit(function(e) {
    	e.preventDefault();
	
    	$itemList.sortable({
    	    disabled: false,
    	});
	$questiontext.text("Now please rank the risks, putting the risk you consider most important at the top.");
	//document.getElementById("next-button").value = "Submit";
	$nextpagebutton.val("Submit");
    });
    
    // Add todo
    $form.submit(function(e) {
	e.preventDefault();
	$.publish('/add/', []);
    });

    // Remove todo
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
	if ($newTodo.val() !== "") {
	    // Take the value of the input field and save it to localStorage
	    localStorage.setItem( 
		"todo-" + i, $newTodo.val() 
	    );
            
	    // Set the to-do max counter so on page refresh it keeps going up instead of reset
	    localStorage.setItem('todo-counter', i);
            
	    // Append a new list item with the value of the new todo list
	    $itemList.append(
                "<li id='todo-" + i + "'>"
                    + "<span class='editable'>"
                    + localStorage.getItem("todo-" + i) 
                    + " </span><a href='#'>x</a></li>"
	    );

	    $.publish('/regenerate-list/', []);

	    // Hide the new list, then fade it in for effects
	    $("#todo-" + i)
		.css('display', 'none')
		.fadeIn();
            
	    // Empty the input field
	    $newTodo.val("");
            
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
	var $todoItemLi = $('#show-items li');
	// Empty the order array
	order.length = 0;
        
	// Go through the list item, grab the ID then push into the array
	$todoItemLi.each(function() {
	    var id = $(this).attr('id');
	    order.push(id);
	});
        
	// Convert the array into string and save to localStorage
	localStorage.setItem(
	    'todo-orders', order.join(',')
	);
    });
    
    $.subscribe('/clear-all/', function() {
	var $todoListLi = $('#show-items li');
        
	order.length = 0;
	localStorage.clear();
	$todoListLi.remove();
    });
});

