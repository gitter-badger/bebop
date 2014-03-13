<?php

$items      = $config->get('data');
$field_name = $config->get('field_name');

?>

<div bebop-list--el="container" bebop-list--fieldName="<?php echo $field_name; ?>" class="bebop-list--container">

	<div bebop-list--el="form" class="bebop-list--form bebop-ui-clrfix">
		<div class="bebop-list--formField">
			<button bebop-list--action="addOne" class="button button-primary"><?php echo $config->get('add_button_text'); ?></button>
		</div>
		<!-- <div class="bebop-list--formField">
			<button bebop-list--action="enableReorderView" class="button button-small">Reorder</button>
		</div> -->
	</div>	

	<ul bebop-list--el="list" bebop-list--is-sortable="true" class="bebop-list--list">
		<?php if ($items) {
			foreach ($items as $item) { ?>
				
				<input bebop-list--el="data-placeholder" type="hidden" name="<?php echo $field_name; ?>[]" value='<?php echo $item; ?>'>

			<?php }
		} ?>
	</ul>
	
	<li bebop-list--el="item-template" class="bebop-list--item" style="display:none">
		
		<input bebop-list--el="data-container" type="hidden">
		
		<div class="bebop-list--drag-handle">
			<span class="bebop-ui-icon-move"></span>
		</div>
		
		<div class="bebop-list--item-content">
			<?php call_user_func($config->get('fn')); ?>
		</div>

		<div class="bebop-list--item-actions">
			<button bebop-list--action="edit" class="button button-small">
				<b>Edit</b>
				<span class="bebop-ui-icon-edit"></span>
			</button>
			<button bebop-list--action="remove" class="button button-small">
				<span class="bebop-ui-icon-remove"></span>
			</button>
		</div>
	</li>

	<div bebop-list--el="empty-state-indicator" class="bebop-list--empty-state-indicator" style="display:none">
		<input type="hidden">
		<span class="bebop-list--item-name">No items added until now</span>
	</div>
	
</div>