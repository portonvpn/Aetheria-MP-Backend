function CameraControl( player, camera ) {

	var group = new THREE.Group();
	scene.add( group );

	// --- GTA CAMERA ADDITIONS ---
	var yaw = 0;   // Horizontal rotation
	var pitch = 0.2; // Vertical rotation
	const SENSITIVITY = 0.003;
	const MIN_PITCH = -0.3; // Limit looking up
	const MAX_PITCH = 1.0;  // Limit looking down
	// ----------------------------

	const CAMERA_DIRECTION = new THREE.Vector3( 0, 0.4, 1 ).normalize();
	const DEFAULT_CAMERA_DISTANCE = 2.2 ;
	const MIN_CAMERA_DISTANCE = 1.7 ;
	const CAMERA_WIDTH = 0.29 ;
	const CAMERA_TWEENING_SPEED = 0.08 ;

	var backupCameraPos = new THREE.Vector3();
	var cameraTarget = new THREE.Vector3();
	var cameraWantedPos = new THREE.Vector3();

	var testRayOrigin = new THREE.Vector3();
	var testRayDirection = new THREE.Vector3();
	var testRay = new THREE.Ray( testRayOrigin, testRayDirection );

	var cameraRayOrigin = new THREE.Vector3( 0, 0.3, 0 );
	var cameraRayDirection = new THREE.Vector3();
	var cameraRayAxis = new THREE.Vector3( 0, 1, 0 );
	var cameraRay = new THREE.Ray( cameraRayOrigin, cameraRayDirection );

	// --- MOUSE INPUT HANDLING ---
	document.addEventListener('mousemove', (event) => {
		if (document.pointerLockElement === document.body) {
			yaw -= event.movementX * SENSITIVITY;
			pitch += event.movementY * SENSITIVITY;
			
			// Clamp pitch so camera doesn't flip over
			pitch = Math.max(MIN_PITCH, Math.min(MAX_PITCH, pitch));
		}
	});

	// Click to lock mouse (GTA style)
	document.addEventListener('mousedown', () => {
		document.body.requestPointerLock();
	});
	// ----------------------------

	var directionalLight = addShadowedLight( 3, 25, 7, 0xffffff, 0.85 );
    group.add( directionalLight );
    group.add( directionalLight.target );

    function addShadowedLight( x, y, z, color, intensity ) {
        var directionalLight = new THREE.DirectionalLight( color, intensity );
        directionalLight.position.set( x, y, z );
        directionalLight.castShadow = true;
        var d = 10;
        directionalLight.shadow.camera.left = -d;
        directionalLight.shadow.camera.right = d;
        directionalLight.shadow.camera.top = d;
        directionalLight.shadow.camera.bottom = -d;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.bias = -0;
        return directionalLight;
    };

    function hideLight() { directionalLight.visible = false; };
    function showLight() { directionalLight.visible = true; };

	adaptFOV();
	resetCameraPos();
	scene.add( camera );

	function adaptFOV() {
		if ( window.innerHeight > window.innerWidth ) {
			camera.fov = 110 ;
		} else {
			camera.fov = 90 ;
		};
		camera.updateProjectionMatrix();
	};

	function update( delta ) {

		group.position.copy( player.position );
		// Light follows player
		directionalLight.position.set(
			player.position.x + 3,
			player.position.y + 25,
			player.position.z + 7
		);
		directionalLight.target.position.copy(player.position);

		cameraTarget.copy( player.position );
		cameraTarget.y += atlas.PLAYERHEIGHT / 1.5 ; // Target chest/head height

		/////////////////////////
		/// CALCULATE ROTATION
		/////////////////////////

		// Calculate direction based on mouse yaw and pitch
		cameraRay.origin.copy( cameraTarget );
		
		cameraRay.direction.set(
			Math.sin(yaw) * Math.cos(pitch),
			Math.sin(pitch),
			Math.cos(yaw) * Math.cos(pitch)
		).normalize();

		/// CAMERA COLLISION (Keep existing logic to prevent wall clipping)
		let stages = [
			Math.floor( player.position.y ),
			Math.floor( player.position.y ) +1,
			Math.floor( player.position.y ) +2,
			Math.floor( player.position.y ) +3
		];

		let rayCollision = atlas.intersectRay( cameraRay, stages, true );

		var distCamera = DEFAULT_CAMERA_DISTANCE;
		if ( rayCollision ) {
			distCamera = Math.min(DEFAULT_CAMERA_DISTANCE, rayCollision.points[ 0 ].distanceTo( cameraRay.origin ) - 0.1);
		}

		// Position camera at the distance
		cameraRay.at( distCamera, cameraWantedPos );

		// Final check: Move camera up if it's too close to the ground
		if ( distCamera < MIN_CAMERA_DISTANCE ) {
			cameraWantedPos.y += 0.5; 
		}

		//////////////////////
		///  POSITION CAMERA
		//////////////////////

		backupCameraPos.copy( camera.position );

		attemptCameraMove( 'x', delta );
		attemptCameraMove( 'y', delta );
		attemptCameraMove( 'z', delta );

		camera.lookAt( cameraTarget );
	};

	function attemptCameraMove( dir, delta ) {
		camera.position[ dir ] = utils.lerp( camera.position[ dir ], cameraWantedPos[ dir ], CAMERA_TWEENING_SPEED * delta );
		if ( atlas.collideCamera() ) {
			camera.position[ dir ] = backupCameraPos[ dir ];
		};
	};

	function resetCameraPos() {
		yaw = 0;
		pitch = 0.2;
		camera.position.copy( player.position );
		camera.position.z += DEFAULT_CAMERA_DISTANCE;
	};

	return {
		update,
		directionalLight,
		adaptFOV,
		CAMERA_WIDTH,
		resetCameraPos,
		hideLight,
		showLight,
		// Exporting yaw so controler.js can use it for movement
		getYaw: () => yaw 
	};
};
