import java.util.Properties

plugins {
    id("com.android.application")
}

// Everything that changes between local testing and the Play Store build comes
// from gradle.properties (or -P on the command line), so nothing is hard-coded.
fun prop(name: String): String = (findProperty(name) as String?)?.trim().orEmpty()

val host = prop("proppageHost")
val scheme = prop("proppageScheme").ifEmpty { "https" }
val siteOrigin = "$scheme://$host"
val code = prop("proppageVersionCode").toInt()

// The app's signing key, kept outside git (see android/README.md).
val keystoreFile = rootProject.file("keystore.properties")
val keystore = Properties().apply { if (keystoreFile.exists()) keystoreFile.inputStream().use { load(it) } }

android {
    namespace = "com.rturox.proppage"
    compileSdk = 36

    defaultConfig {
        applicationId = prop("proppageAppId")
        minSdk = 24
        targetSdk = 36
        versionCode = code
        versionName = prop("proppageVersionName")

        // Links on the site open in the app. Local http test builds claim no links: an
        // unverified http site would bounce every redirect back into the app.
        manifestPlaceholders["hostName"] = if (scheme == "https") host.substringBefore(":") else "local-test.invalid"
        // app=android tells the site it is inside the app (lib/app-install.ts); v says which
        // version. Changing this later means every agent has to install a new APK.
        manifestPlaceholders["launchUrl"] = "$siteOrigin/dashboard?app=android&v=$code"
        manifestPlaceholders["linkScheme"] = scheme
        resValue("string", "app_name", prop("proppageAppName"))
        // Must match the site's /.well-known/assetlinks.json for full-screen mode.
        resValue(
            "string",
            "asset_statements",
            """[{"relation":["delegate_permission/common.handle_all_urls"],"target":{"namespace":"web","site":"$siteOrigin"}}]""",
        )
    }

    buildFeatures {
        resValues = true
    }

    signingConfigs {
        if (keystore.isNotEmpty()) {
            create("release") {
                storeFile = file(keystore.getProperty("storeFile"))
                storePassword = keystore.getProperty("storePassword")
                keyAlias = keystore.getProperty("keyAlias")
                keyPassword = keystore.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (keystore.isNotEmpty()) signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.7.4")
}

// Refuse a release build that still points at the placeholder domain. This runs before
// anything compiles: a check on assembleRelease or bundleRelease fires after the file is written.
tasks.matching { it.name == "preReleaseBuild" }.configureEach {
    doFirst {
        check(host.isNotEmpty() && !host.startsWith("REPLACE")) { "Set proppageHost in android/gradle.properties to your real domain first." }
        check(scheme == "https") { "Release builds must use https." }
        check(keystore.isNotEmpty()) { "Create android/keystore.properties first (see android/README.md)." }
    }
}
