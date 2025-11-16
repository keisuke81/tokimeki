<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the installation.
 * You don't have to use the website, you can copy this file to "wp-config.php"
 * and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * Database settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/
 *
 * @package WordPress
 */

// ** Database settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define( 'DB_NAME', 'tokimeki_wp_1' );

/** Database username */
define( 'DB_USER', 'root' );

/** Database password */
define( 'DB_PASSWORD', 'root' );

/** Database hostname */
define( 'DB_HOST', 'localhost' );

/** Database charset to use in creating database tables. */
define( 'DB_CHARSET', 'utf8mb4' );

/** The database collate type. Don't change this if in doubt. */
define( 'DB_COLLATE', '' );

/**#@+
 * Authentication unique keys and salts.
 *
 * Change these to different unique phrases! You can generate these using
 * the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}.
 *
 * You can change these at any point in time to invalidate all existing cookies.
 * This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define( 'AUTH_KEY',         '2EW(Vr535zc;t<!K$jGjLTyO(ha21f*4?zN}phA-27i zE_d63$E:CLYsLU~+2&V' );
define( 'SECURE_AUTH_KEY',  't]k+yQbAevwkZ1O/~QU7oXwN*o%`.|bSaF3<4nzxq0mf,QYS&8jdrnQ~e<k1FvT,' );
define( 'LOGGED_IN_KEY',    'Q`8vE2&}9@kDcVogh:&aR&%/n&KAHB}j<#).2{U%=!X?*tb$hcPkE-Cq,I9m.r2>' );
define( 'NONCE_KEY',        ';VQx+ED;y>SQD$|w$b<-EsUXsg3fkM;s[$Y4]j: VKmqjF>eBk`b-s i7|mICj#p' );
define( 'AUTH_SALT',        '9oR)L4OO~(a2^Z,/NYN-s/tej?N,0:KAA0EolV,#JYEssM&EGP;aWm}h@vC[X}|P' );
define( 'SECURE_AUTH_SALT', 'g-d}5!S,r*MkF{s%tDJ#xJ3*0@Hn/?=@*aA6r6=.: hF^7Y^.K/,.+IC_nIjT%z:' );
define( 'LOGGED_IN_SALT',   'IC2?%ta1IE!rL3)v?m5>cnFSMw9/{lx<cClm-z3ZpKn48ZqBy&o_,zb[kD@IEH-#' );
define( 'NONCE_SALT',       'P#Q!B?ELI|9En-g;_,B~J$*KZ:Js$3_3Z^I(^Q0;VQ#gq-!I2HxEM/66gE]+oY3n' );

/**#@-*/

/**
 * WordPress database table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 *
 * At the installation time, database tables are created with the specified prefix.
 * Changing this value after WordPress is installed will make your site think
 * it has not been installed.
 *
 * @link https://developer.wordpress.org/advanced-administration/wordpress/wp-config/#table-prefix
 */
$table_prefix = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the documentation.
 *
 * @link https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/
 */
define( 'WP_DEBUG', false );

/* Add any custom values between this line and the "stop editing" line. */



/* That's all, stop editing! Happy publishing. */

/** Absolute path to the WordPress directory. */
if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

/** Sets up WordPress vars and included files. */
require_once ABSPATH . 'wp-settings.php';
