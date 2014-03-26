;(function(window, document, undefined, $) {

	window.Bebop = window.Bebop || {};

	var List = Bebop.List = Backbone.View.extend({

		events: {
			'click [bebop-list--el="form"] [bebop-list--action]': 'doAction'
		},

		initialize: function(options) {

			// Store reference to current instance
			var self = this;

			// Collect container DOM element
			this.$el = $(options.el);

			// Get instance configuration
			var config  = this.$el.attr('bebop-list--config');
			this.config = new Backbone.Model(config ? JSON.parse(config) : {});
			this.$el.attr('bebop-media--config', null);

			this.status = new Backbone.Model({
				mode: this.config.get('mode'),
				view: 'browse',
				insertAction: null,
				empty: false,
				isSortable: true,
				templateEngine: 'mustache'
			});

			this.collection = new List.Collection(),

			// Collect form DOM element and action buttons
			this.$form = this.$el.find('[bebop-list--el="form"]');

			this.buttons = {
				add: {
					$el: this.$form.find('[bebop-list--action^="insertAtThe"]')
				},
				sort: {
					$el: this.$form.find('[bebop-list--action="toggleReorder"]')
				}
			}

			// Collect list DOM element
			this.$list = this.$el.find('[bebop-list--el="list"]');

			// Collect item DOM elements
			this.$dataPlaceholders = this.$list.find('[bebop-list--el="data-placeholder"]');

			// Add each item to collection
			_.each(this.$dataPlaceholders, function(el, index) {

				var jsonData = $(el).val();

				if (jsonData) this.collection.add(JSON.parse(jsonData));

			}, this);

			// Get field name
			this.fieldName = this.config.get('field_name');

			//////////////////////
			// Handle templates //
			//////////////////////
			this.templates = {};
			
			$rawItemTemplate = this.$el.find('[bebop-list--template="item"]');
			$browseTemplate  = this.$el.find('[bebop-list--template="browse-view"]');
			$reorderTemplate = this.$el.find('[bebop-list--template="reorder-view"]');
			$editTemplate    = this.$el.find('[bebop-list--template="edit-view"]');

			this.itemTemplates = {
				main: $rawItemTemplate.clone().find('[bebop-list--el="data-container"]').attr('name', this.fieldName).end().html(),
				browse: $browseTemplate.html(),
				reorder: $reorderTemplate.html(),
				edit: $editTemplate.html()
			}

			$rawItemTemplate.remove();
			$browseTemplate.remove();
			$reorderTemplate.remove();
			$editTemplate.remove();

			// Collect empty state indicator DOM element
			this.$emptyStateIndicator = this.$el.find('[bebop-list--el="empty-state-indicator"]');

			this.handleEmptyIndicator = function() {

				if (self.status.hasChanged('empty')) {

					if (self.status.get('empty')) {

						self.$emptyStateIndicator.attr('name', self.fieldName).slideDown(200);

					} else {

						self.$emptyStateIndicator.attr('name', '').slideUp(200);
					}
				}
			}

			this.listenTo(this.status, 'change:empty', this.handleEmptyIndicator);

			if (this.collection.length == 0) this.status.set('empty', true);

			// Remove empty state item
			this.collection.on('add', function(model) {

				var insertAction = this.status.get('insertAction');

				if (insertAction == 'append') {

					this.appendItem(model);

				} else if(insertAction == 'prepend') {

					this.prependItem(model);
				}

				if(this.collection.length == 1) this.status.set('empty', false);

			}, this);

			// Add empty state item
			this.collection.on('remove', function(model) {

				if(this.collection.length == 0) this.status.set('empty', true);

			}, this);

			// Check sortable configuration attribute
			if (this.$list.attr('bebop-list--is-sortable') == 'true')
				this.status.set('isSortable', true);

			if (this.isMode('gallery')) {

				// Instantiate WordPress media picker
				this.mediaPicker = wp.media({
					frame: 'select',
		            multiple: true,
		            title: 'Upload or select existing resources',
		            library: {
		                type: 'image'
		            },
		            button: {
		                text: 'Add images'
		            }
				});

				this.mediaPicker.on("select", function() {

					var selection = this.mediaPicker.state().get('selection').toJSON();

					_.each(selection, function(file, index, selection) {

						if (file.type == 'image') {

							this.collection.add(new List.ItemModel({
								id: file.id,
								view: this.status.get('view'),
								mode: this.status.get('mode')
							}));
						} 

					}, this);

				}, this);
			}

			this.status.on('change:view', function() {

				this.refresh();

			}, this);

			this.$list.sortable({
				handle: ".bebop-list--drag-handle",
				placeholder: "bebop-list--item-placeholder bebop-ui-icon-target"
			});

			this.render();
		},

		doAction: function(event) {

			event.preventDefault();

			var action = $(event.currentTarget).attr('bebop-list--action');

			// Execute action if available
			if (this[action] != undefined) this[action](event);
		},

		isMode: function(mode) {

			return this.status.get('mode') == mode ? true : false;
		},

		toggleReorder: function() {

			if (this.status.get('view') != 'reorder') {

				this.status.set('view', 'reorder');
				this.buttons.sort.$el.addClass('is-enabled');

			} else {

				this.status.set('view', 'browse');
				this.buttons.sort.$el.removeClass('is-enabled');
			}
		},

		insertAtTheTop: function(event) {

			this.status.set('insertAction', 'prepend');

			if (this.isMode('gallery')) {

				this.mediaPicker.open();

			} else {

				this.addNewEmptyModel();
			}
		},

		insertAtTheBottom: function(event) {

			this.status.set('insertAction', 'append');

			if (this.isMode('gallery')) {

				this.mediaPicker.open();

			} else {
				
				this.addNewEmptyModel();
			}
		},

		getNewItemView: function(model) {

			return new List.ItemView({
				model: model,
				templates: this.itemTemplates,
				fieldName: this.fieldName,
				mode: this.status.get('mode')
			});
		},

		addNewEmptyModel: function() {

			this.collection.add(new List.ItemModel({view: 'edit'}));
		},

		prependItem: function(model) {

			var itemView = this.getNewItemView(model);

			this.$list.prepend(itemView.render().el);
		},

		appendItem: function(model) {

			var itemView = this.getNewItemView(model);

			this.$list.append(itemView.render().el);
		},

		refresh: function() {

			var previousView = this.status.previous('view'),
				currentView  = this.status.get('view');

			// Re-render all 
			this.collection.each(function(model) {	

				model.set('view', currentView);	

			}, this);
		},

		render: function(){

			// Re-render all 
			this.collection.each(function(model) {	

				this.appendItem(model);

			}, this);

			// Remove all data placeholders if we still have them
			if (this.$dataPlaceholders.length > 0)
				this.$dataPlaceholders.remove();

			return this;
		}
	});

})(window, document, undefined, jQuery || $);