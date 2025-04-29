extends Sprite3D;
var velocity:int = 20;
var angular_speed:float = PI;

func _process(delta):
	rotation += angular_speed * delta